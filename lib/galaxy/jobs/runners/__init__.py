import os, logging, os.path

from galaxy import model
from Queue import Queue, Empty
import time
import threading

log = logging.getLogger( __name__ )

class BaseJobRunner( object ):
    def build_command_line( self, job_wrapper, include_metadata=False ):
        """
        Compose the sequence of commands necessary to execute a job. This will
        currently include:

            - environment settings corresponding to any requirement tags
            - preparing input files
            - command line taken from job wrapper
            - commands to set metadata (if include_metadata is True)
        """

        def in_directory( file, directory ):
            """
            Return true, if the common prefix of both is equal to directory
            e.g. /a/b/c/d.rst and directory is /a/b, the common prefix is /a/b
            """

            # Make both absolute.
            directory = os.path.abspath( directory )
            file = os.path.abspath( file )

            return os.path.commonprefix( [ file, directory ] ) == directory

        commands = job_wrapper.get_command_line()
        # All job runners currently handle this case which should never
        # occur
        if not commands:
            return None
        # Prepend version string
        if job_wrapper.version_string_cmd:
            commands = "%s &> %s; " % ( job_wrapper.version_string_cmd, job_wrapper.get_version_string_path() ) + commands
        # prepend getting input files (if defined)
        if hasattr(job_wrapper, 'prepare_input_files_cmds') and job_wrapper.prepare_input_files_cmds is not None:
            commands = "; ".join( job_wrapper.prepare_input_files_cmds + [ commands ] ) 
        # Prepend dependency injection
        if job_wrapper.dependency_shell_commands:
            commands = "; ".join( job_wrapper.dependency_shell_commands + [ commands ] ) 

        # -- Append commands to copy job outputs based on from_work_dir attribute. --

        # Set up dict of dataset id --> output path; output path can be real or 
        # false depending on outputs_to_working_directory
        output_paths = {}
        for dataset_path in job_wrapper.get_output_fnames():
            path = dataset_path.real_path
            if self.app.config.outputs_to_working_directory:
                path = dataset_path.false_path
            output_paths[ dataset_path.dataset_id ] = path

        # Walk job's output associations to find and use from_work_dir attributes.
        job = job_wrapper.get_job()
        job_tool = self.app.toolbox.tools_by_id.get( job.tool_id, None )
        for dataset_assoc in job.output_datasets + job.output_library_datasets:
            for dataset in dataset_assoc.dataset.dataset.history_associations + dataset_assoc.dataset.dataset.library_associations:
                if isinstance( dataset, self.app.model.HistoryDatasetAssociation ):
                    joda = self.sa_session.query( self.app.model.JobToOutputDatasetAssociation ).filter_by( job=job, dataset=dataset ).first()
                    if joda and job_tool:
                        hda_tool_output = job_tool.outputs.get( joda.name, None )
                        if hda_tool_output and hda_tool_output.from_work_dir:
                            # Copy from working dir to HDA.
                            # TODO: move instead of copy to save time?
                            source_file = os.path.join( os.path.abspath( job_wrapper.working_directory ), hda_tool_output.from_work_dir )
                            destination = output_paths[ dataset.dataset_id ]
                            if in_directory( source_file, job_wrapper.working_directory ):
                                try:
                                    commands += "; cp %s %s" % ( source_file, destination )
                                    log.debug( "Copying %s to %s as directed by from_work_dir" % ( source_file, destination ) )
                                except ( IOError, OSError ):
                                    log.debug( "Could not copy %s to %s as directed by from_work_dir" % ( source_file, destination ) )
                            else:
                                # Security violation.
                                log.exception( "from_work_dir specified a location not in the working directory: %s, %s" % ( source_file, job_wrapper.working_directory ) )



        # Append metadata setting commands, we don't want to overwrite metadata
        # that was copied over in init_meta(), as per established behavior
        if include_metadata and self.app.config.set_metadata_externally:
            commands += "; cd %s; " % os.path.abspath( os.getcwd() )
            commands += job_wrapper.setup_external_metadata( 
                            exec_dir = os.path.abspath( os.getcwd() ),
                            tmp_dir = job_wrapper.working_directory,
                            dataset_files_path = self.app.model.Dataset.file_path,
                            output_fnames = job_wrapper.get_output_fnames(),
                            set_extension = False,
                            kwds = { 'overwrite' : False } ) 
        return commands

class ClusterJobState( object ):
    """
    Encapsulate the state of a cluster job, this should be subclassed as
    needed for various job runners to capture additional information needed
    to communicate with cluster job manager.
    """

    def __init__( self ):
        self.job_wrapper = None
        self.job_id = None
        self.old_state = None
        self.running = False
        self.runner_url = None

STOP_SIGNAL = object()

JOB_STATUS_QUEUED = 'queue'
JOB_STATUS_FAILED = 'fail'
JOB_STATUS_FINISHED = 'finish'

class ClusterJobRunner( BaseJobRunner ):
    """
    Not sure this is the best name for this class, but there is common code
    shared between sge, pbs, drmaa, etc...
    """

    def __init__( self, app ):
        self.app = app
        self.sa_session = app.model.context
        # 'watched' and 'queue' are both used to keep track of jobs to watch.
        # 'queue' is used to add new watched jobs, and can be called from
        # any thread (usually by the 'queue_job' method). 'watched' must only
        # be modified by the monitor thread, which will move items from 'queue'
        # to 'watched' and then manage the watched jobs.
        self.watched = []
        self.monitor_queue = Queue()

    def _init_monitor_thread(self):
        self.monitor_thread = threading.Thread( name="%s.monitor_thread" % self.runner_name, target=self.monitor )
        self.monitor_thread.setDaemon( True )
        self.monitor_thread.start()

    def _init_worker_threads(self):
        self.work_queue = Queue()
        self.work_threads = []
        nworkers = self.app.config.cluster_job_queue_workers
        for i in range( nworkers ):
            worker = threading.Thread( name="%s.work_thread-%d" % (self.runner_name, i), target=self.run_next )
            worker.start()
            self.work_threads.append( worker )

    def handle_stop(self):
        # DRMAA and SGE runners should override this and disconnect.
        pass

    def monitor( self ):
        """
        Watches jobs currently in the cluster queue and deals with state changes
        (queued to running) and job completion
        """
        while 1:
            # Take any new watched jobs and put them on the monitor list
            try:
                while 1: 
                    cluster_job_state = self.monitor_queue.get_nowait()
                    if cluster_job_state is STOP_SIGNAL:
                        # TODO: This is where any cleanup would occur
                        self.handle_stop()
                        return
                    self.watched.append( cluster_job_state )
            except Empty:
                pass
            # Iterate over the list of watched jobs and check state
            self.check_watched_items()
            # Sleep a bit before the next state check
            time.sleep( 1 )

    def run_next( self ):
        """
        Run the next item in the queue (a job waiting to run or finish )
        """
        while 1:
            ( op, obj ) = self.work_queue.get()
            if op is STOP_SIGNAL:
                return
            try:
                if op == JOB_STATUS_QUEUED:
                    # If the next item is to be run, then only run it if the
                    # job state is "queued". Otherwise the next item was either
                    # cancelled or one of its siblings encountered an error.
                    job_state = obj.get_state()
                    if model.Job.states.QUEUED == job_state:
                        self.queue_job( obj )
                    else:
                        log.debug( "Not executing job %d in state %s"  % ( obj.get_id_tag(), job_state ) ) 
                elif op == JOB_STATUS_FINISHED:
                    self.finish_job( obj )
                elif op == JOB_STATUS_FAILED:
                    self.fail_job( obj )
            except:
                log.exception( "Uncaught exception %sing job" % op )

    def monitor_job(self, job_state):
        self.monitor_queue.put( job_state )

    def put( self, job_wrapper ):
        """Add a job to the queue (by job identifier)"""
        # Change to queued state before handing to worker thread so the runner won't pick it up again
        job_wrapper.change_state( model.Job.states.QUEUED )
        self.mark_as_queued(job_wrapper)

    def shutdown( self ):
        """Attempts to gracefully shut down the monitor thread"""
        log.info( "sending stop signal to worker threads" )
        self.monitor_queue.put( STOP_SIGNAL )
        for i in range( len( self.work_threads ) ):
            self.work_queue.put( ( STOP_SIGNAL, None ) )

    def check_watched_items(self):
        """
        This method is responsible for iterating over self.watched and handling
        state changes and updating self.watched with a new list of watched job
        states. Subclasses can opt to override this directly (as older job runners will
        initially) or just override check_watched_item and allow the list processing to
        reuse the logic here.
        """
        new_watched = []
        for cluster_job_state in self.watched:
            new_cluster_job_state = self.check_watched_item(cluster_job_state)
            if new_cluster_job_state:
                new_watched.append(new_cluster_job_state)
        self.watched = new_watched

    # Subclasses should implement this unless they override check_watched_items all together.
    def check_watched_item(self):
        raise NotImplementedError()

    def queue_job(self, job_wrapper):
        raise NotImplementedError()

    def finish_job(self, job_state):
        raise NotImplementedError()

    def fail_job(self, job_state):
        raise NotImplementedError()

    def mark_as_finished(self, job_state):
        self.work_queue.put( ( JOB_STATUS_FINISHED, job_state ) )

    def mark_as_failed(self, job_state):
        self.work_queue.put( ( JOB_STATUS_FAILED, job_state ) )

    def mark_as_queued(self, job_wrapper):
        self.work_queue.put( ( JOB_STATUS_QUEUED, job_wrapper ) )
