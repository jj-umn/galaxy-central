var History=BaseModel.extend(LoggableMixin).extend({defaults:{id:"",name:"",state:"",diskSize:0,deleted:false,annotation:null,message:null},urlRoot:"api/histories/",url:function(){return"api/histories/"+this.get("id")},initialize:function(a,b){this.log(this+".initialize:",a,b);this.hdas=new HDACollection();if(b){if(_.isArray(b)){this.hdas.reset(b);this.checkForUpdates()}else{if(_.isString(b)&&(b.match(/error/i))){alert(_l("Error loading bootstrapped history")+":\n"+b)}}}},loadFromApi:function(a,c){var b=this;b.attributes.id=a;jQuery.when(jQuery.ajax("api/users/current"),b.fetch()).then(function(e,d){b.attributes.user=e[0];b.trigger("loaded:user",e[0]);b.trigger("loaded",d[0])}).then(function(){jQuery.ajax(b.url()+"/contents?"+jQuery.param({ids:b.hdaIdsFromStateIds().join(",")})).success(function(d){b.hdas.reset(d);b.checkForUpdates();b.trigger("loaded:hdas",d);if(c){callback(b)}})})},hdaIdsFromStateIds:function(){return _.reduce(_.values(this.get("state_ids")),function(b,a){return b.concat(a)})},checkForUpdates:function(a){if(this.hdas.running().length){this.stateUpdater()}else{this.trigger("ready")}return this},stateUpdater:function(){var c=this,a=this.get("state"),b=this.get("state_ids");jQuery.ajax("api/histories/"+this.get("id")).success(function(d){c.set(d);c.log("current history state:",c.get("state"),"(was)",a,"new size:",c.get("nice_size"));var e=[];_.each(_.keys(d.state_ids),function(g){var f=_.difference(d.state_ids[g],b[g]);e=e.concat(f)});if(e.length){c.fetchHdaUpdates(e)}if((c.get("state")===HistoryDatasetAssociation.STATES.RUNNING)||(c.get("state")===HistoryDatasetAssociation.STATES.QUEUED)){setTimeout(function(){c.stateUpdater()},History.UPDATE_DELAY)}else{c.trigger("ready")}}).error(function(f,d,e){if(!((f.readyState===0)&&(f.status===0))){alert(_l("Error getting history updates from the server.")+"\n"+e)}})},fetchHdaUpdates:function(b){var a=this;jQuery.ajax({url:this.url()+"/contents?"+jQuery.param({ids:b.join(",")}),error:function(h,c,d){if((h.readyState===0)&&(h.status===0)){return}var f=JSON.parse(h.responseText);if(_.isArray(f)){var e=_.groupBy(f,function(i){if(_.has(i,"error")){return"errored"}return"ok"});a.log("fetched, errored datasets:",e.errored);a.updateHdas(f)}else{var g=_l("ERROR updating hdas from api history contents")+": ";a.log(g,b,h,c,d,errorJSON);alert(g+b.join(","))}},success:function(d,c,e){a.log(a+".fetchHdaUpdates, success:",c,e);a.updateHdas(d)}})},updateHdas:function(a){var c=this,b=[];c.log(c+".updateHdas:",a);_.each(a,function(e,f){var d=c.hdas.get(e.id);if(d){c.log("found existing model in list for id "+e.id+", updating...:");d.set(e)}else{c.log("NO existing model for id "+e.id+", creating...:");b.push(e)}});if(b.length){c.addHdas(b)}},addHdas:function(a){var b=this;_.each(a,function(c,d){var e=b.hdas.hidToCollectionIndex(c.hid);c.history_id=b.get("id");b.hdas.add(new HistoryDatasetAssociation(c),{at:e,silent:true})});b.hdas.trigger("add",a)},toString:function(){var a=(this.get("name"))?(","+this.get("name")):("");return"History("+this.get("id")+a+")"}});History.UPDATE_DELAY=4000;var HistoryCollection=Backbone.Collection.extend(LoggableMixin).extend({model:History,urlRoot:"api/histories"});