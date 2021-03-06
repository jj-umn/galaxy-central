//define([
//], function(){

//function saveVis( title, config ){
//    var xhr = jQuery.ajax( '/api/visualizations', {
//        type : 'POST',
//        data : {
//            type    : 'scatterplot',
//            title   : title,
//            config  : JSON.stringify( config )
//        }
//    });
//    xhr.fail( function( xhr, status, message ){
//        console.debug( jQuery.makeArray( arguments ) );
//        console.error( 'Error saving visualization:', xhr.responseJSON.error );
//    });
//    return xhr.then( function( saveInfo ){
//        return saveInfo;
//    });
//}

//==============================================================================
/** @class Model for a saved Galaxy visualization.
 *
 *  @augments Backbone.Model
 *  @borrows LoggableMixin#logger as #logger
 *  @borrows LoggableMixin#log as #log
 *  @constructs
 */
var Visualization = Backbone.Model.extend( LoggableMixin ).extend(
/** @lends Visualization.prototype */{

    ///** logger used to record this.log messages, commonly set to console */
    //// comment this out to suppress log output
    //logger              : console,

    /** default attributes for a model */
    defaults : {
        //id      : null,
        //type    : null,
        //title   : null,
        //dbkey   : null,
        //user_id : null,
        //slug    : null,
        //revisions       : [],
        //latest_revision : null

        //(this is unusual in that visualizations don't have configs, revisions do)
        //config : {}
    },

    url : function(){
        return galaxy_config.root + 'api/visualizations';
    },

    /** Set up the model, determine if accessible, bind listeners
     *  @see Backbone.Model#initialize
     */
    initialize : function( data ){
        this.log( this + '.initialize', data, this.attributes );
        this._setUpListeners();
    },

    /** set up any event listeners
     */
    _setUpListeners : function(){
    },

    // ........................................................................ config
    setConfig: function( config ){
        var oldConfig = this.get( 'config' );
        // extend if already exists (and clone in order to trigger change)
        if( _.isObject( oldConfig ) ){
            config = _.extend( _.clone( oldConfig ), config );
        }
        this.set( 'config', config );
        return this;
    },

    // ........................................................................ common queries
    // ........................................................................ ajax
    // ........................................................................ misc
    /** String representation */
    toString : function(){
        var idAndTitle = this.get( 'id' ) || '';
        if( this.get( 'title' ) ){
            idAndTitle += ':' + this.get( 'title' );
        }
        return 'Visualization(' + idAndTitle + ')';
    }
});


//==============================================================================
/** @class Backbone collection of visualization models
 *
 *  @borrows LoggableMixin#logger as #logger
 *  @borrows LoggableMixin#log as #log
 *  @constructs
 */
var VisualizationCollection = Backbone.Collection.extend( LoggableMixin ).extend(
/** @lends VisualizationCollection.prototype */{
    model           : Visualization,

    ///** logger used to record this.log messages, commonly set to console */
    //// comment this out to suppress log output
    //logger              : console,

    url : function(){
        return galaxy_config.root + 'api/visualizations';
    },

    /** Set up.
     *  @see Backbone.Collection#initialize
     */
    initialize : function( models, options ){
        options = options || {};
        //this._setUpListeners();
    },

    //_setUpListeners : function(){
    //},

    // ........................................................................ common queries
    // ........................................................................ ajax
    // ........................................................................ misc
    set : function( models, options ){
        // arrrrrrrrrrrrrrrrrg...
        // override to get a correct/smarter merge when incoming data is partial (e.g. stupid backbone)
        //  w/o this partial models from the server will fill in missing data with model defaults
        //  and overwrite existing data on the client
        // see Backbone.Collection.set and _prepareModel
        var collection = this;
        models = _.map( models, function( model ){
            var existing = collection.get( model.id );
            if( !existing ){ return model; }

            // merge the models _BEFORE_ calling the superclass version
            var merged = existing.toJSON();
            _.extend( merged, model );
            return merged;
        });
        // now call superclass when the data is filled
        Backbone.Collection.prototype.set.call( this, models, options );
    },

    /** String representation. */
    toString : function(){
         return ([ 'VisualizationCollection(', [ this.historyId, this.length ].join(), ')' ].join( '' ));
    }
});


//==============================================================================
//return {
//    Visualization           : Visualization,
//    VisualizationCollection : VisualizationCollection
//};});
