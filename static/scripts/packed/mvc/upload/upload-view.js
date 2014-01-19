define(["galaxy.modal","utils/utils","mvc/upload/upload-model","mvc/upload/upload-row","mvc/ui","utils/uploadbox"],function(c,f,e,d){var b=Backbone.Model.extend({defaults:{percentage:0,icon:"fa-circle",label:"",status:""}});var a=Backbone.View.extend({model:null,initialize:function(h){var g=this;this.model=h;this.options=this.model.attributes;this.setElement(this._template(this.options));$(this.el).on("click",this.options.onclick);if(this.options.tooltip){$(this.el).tooltip({title:this.options.tooltip,placement:"bottom"})}this.model.on("change:percentage",function(){g._percentage(g.model.get("percentage"))});this.model.on("change:status",function(){g._status(g.model.get("status"))});var g=this;$(window).on("beforeunload",function(){var i="";if(g.options.onunload){i=g.options.onunload()}if(i!=""){return i}})},_status:function(h){var g=this.$el.find(".progress-bar");g.removeClass();g.addClass("progress-bar");g.addClass("progress-bar-notransition");if(h!=""){g.addClass("progress-bar-"+h)}},_percentage:function(h){var g=this.$el.find(".progress-bar");if(h){g.css({width:h+"%"})}else{g.css({width:"0%"})}},_template:function(g){return'<div class="progress-button"><div class="progress"><div class="progress-bar"></div></div><div id="label" class="label" style="position: absolute; top: 0px; width: inherit; text-align: center;"><div class="fa '+g.icon+'"></div>&nbsp;'+g.label+"</div></div>"}});return Backbone.View.extend({modal:null,button_show:null,uploadbox:null,current_history:null,upload_size:0,select_extension:[["Auto-detect","auto"]],select_genome:[["Unspecified (?)","?"]],collection:new e.Collection(),counter:{announce:0,success:0,error:0,running:0,reset:function(){this.announce=this.success=this.error=this.running=0}},options:{nginx_upload_path:""},initialize:function(h){var g=this;if(!Galaxy.currHistoryPanel){window.setTimeout(function(){g.initialize()},500);return}if(!Galaxy.currUser.get("id")){return}this.button_show=new b({icon:"fa-upload",tooltip:"Upload files",label:"Upload",onclick:function(i){if(i){g._eventShow(i)}},onunload:function(){if(g.counter.running>0){return"Several uploads are still processing."}}});$("#left .unified-panel-header-inner").append((new a(this.button_show)).$el);var g=this;f.jsonFromUrl(galaxy_config.root+"api/datatypes",function(i){for(key in i){g.select_extension.push([i[key],i[key]])}});f.jsonFromUrl(galaxy_config.root+"api/genomes",function(i){var j=g.select_genome[0];g.select_genome=[];for(key in i){if(i[key].length>1){if(i[key][1]!==j[1]){g.select_genome.push(i[key])}}}g.select_genome.sort(function(l,k){return l[0]>k[0]?1:l[0]<k[0]?-1:0});g.select_genome.unshift(j)});if(h){this.options=_.defaults(h,this.options)}this.collection.on("remove",function(i){g._eventRemove(i)});this.collection.on("change:genome",function(j){var i=j.get("genome");g.collection.each(function(k){if(k.get("status")=="init"&&k.get("genome")=="?"){k.set("genome",i)}})})},_eventShow:function(h){h.preventDefault();if(!this.modal){var g=this;this.modal=new c.GalaxyModal({title:"Upload files from your local drive",body:this._template("upload-box","upload-info"),buttons:{Select:function(){g.uploadbox.select()},Create:function(){g._eventCreate()},Upload:function(){g._eventStart()},Pause:function(){g._eventStop()},Reset:function(){g._eventReset()},Close:function(){g.modal.hide()},},height:"400",width:"900"});this.setElement("#upload-box");var g=this;this.uploadbox=this.$el.uploadbox({announce:function(i,j,k){g._eventAnnounce(i,j,k)},initialize:function(i,j,k){return g._eventInitialize(i,j,k)},progress:function(i,j,k){g._eventProgress(i,j,k)},success:function(i,j,k){g._eventSuccess(i,j,k)},error:function(i,j,k){g._eventError(i,j,k)},complete:function(){g._eventComplete()}});this._updateScreen()}this.modal.show()},_eventRemove:function(h){var g=h.get("status");if(g=="success"){this.counter.success--}else{if(g=="error"){this.counter.error--}else{this.counter.announce--}}this._updateScreen();this.uploadbox.remove(h.id)},_eventAnnounce:function(g,h,j){this.counter.announce++;this._updateScreen();var i=new d(this,{id:g,file_name:h.name,file_size:h.size});this.collection.add(i.model);$(this.el).find("tbody:last").append(i.$el);i.render()},_eventInitialize:function(k,g,o){var i=this.collection.get(k);i.set("status","running");var h=i.get("extension");var l=i.get("file_name");var n=i.get("genome");var m=i.get("url_paste");var j=i.get("space_to_tabs");if(!m&&!(g.size>0)){return null}this.uploadbox.configure({url:this.options.nginx_upload_path,paramname:"files_0|file_data"});tool_input={};tool_input.dbkey=n;tool_input.file_type=h;tool_input["files_0|NAME"]=l;tool_input["files_0|type"]="upload_dataset";tool_input["files_0|url_paste"]=m;tool_input.space_to_tabs=j;data={};data.history_id=this.current_history;data.tool_id="upload1";data.inputs=JSON.stringify(tool_input);return data},_eventProgress:function(h,i,g){var j=this.collection.get(h);j.set("percentage",g);this.button_show.set("percentage",this._upload_percentage(g,i.size))},_eventSuccess:function(h,i,k){var j=this.collection.get(h);j.set("status","success");var g=j.get("file_size");this.button_show.set("percentage",this._upload_percentage(100,g));this.upload_completed+=g*100;this.counter.announce--;this.counter.success++;this._updateScreen();Galaxy.currHistoryPanel.refreshHdas()},_eventError:function(g,h,j){var i=this.collection.get(g);i.set("status","error");i.set("info",j);this.button_show.set("percentage",this._upload_percentage(100,h.size));this.button_show.set("status","danger");this.upload_completed+=h.size*100;this.counter.announce--;this.counter.error++;this._updateScreen()},_eventComplete:function(){this.collection.each(function(g){if(g.get("status")=="queued"){g.set("status","init")}});this.counter.running=0;this._updateScreen()},_eventCreate:function(){this.uploadbox.add([{name:"New File",size:-1}])},_eventStart:function(){if(this.counter.announce==0||this.counter.running>0){return}var g=this;this.upload_size=0;this.upload_completed=0;this.collection.each(function(h){if(h.get("status")=="init"){h.set("status","queued");g.upload_size+=h.get("file_size")}});this.button_show.set("percentage",0);this.button_show.set("status","success");this.current_history=Galaxy.currHistoryPanel.model.get("id");this.counter.running=this.counter.announce;this._updateScreen();this.uploadbox.start()},_eventStop:function(){if(this.counter.running==0){return}this.button_show.set("status","info");this.uploadbox.stop();$("#upload-info").html("Queue will pause after completing the current file...")},_eventReset:function(){if(this.counter.running==0){this.collection.reset();this.counter.reset();this._updateScreen();this.uploadbox.reset();this.button_show.set("percentage",0)}},_updateScreen:function(){if(this.counter.announce==0){if(this.uploadbox.compatible()){message="Drag&drop files into this box or click 'Select' to select files!"}else{message="Unfortunately, your browser does not support multiple file uploads or drag&drop.<br>Please upgrade to i.e. Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+."}}else{if(this.counter.running==0){message="You added "+this.counter.announce+" file(s) to the queue. Add more files or click 'Upload' to proceed."}else{message="Please wait..."+this.counter.announce+" out of "+this.counter.running+" remaining."}}$("#upload-info").html(message);if(this.counter.running==0&&this.counter.announce+this.counter.success+this.counter.error>0){this.modal.enableButton("Reset")}else{this.modal.disableButton("Reset")}if(this.counter.running==0&&this.counter.announce>0){this.modal.enableButton("Upload")}else{this.modal.disableButton("Upload")}if(this.counter.running>0){this.modal.enableButton("Pause")}else{this.modal.disableButton("Pause")}if(this.counter.running==0){this.modal.enableButton("Select");this.modal.enableButton("Create")}else{this.modal.disableButton("Select");this.modal.disableButton("Create")}if(this.counter.announce+this.counter.success+this.counter.error>0){$(this.el).find("table").show()}else{$(this.el).find("table").hide()}},_upload_percentage:function(g,h){return(this.upload_completed+(g*h))/this.upload_size},_template:function(h,g){return'<div id="'+h+'" class="upload-box"><table class="table table-striped" style="display: none;"><thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Genome</th><th>Space&#8594;Tab</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div><h6 id="'+g+'" class="upload-info"></h6>'}})});