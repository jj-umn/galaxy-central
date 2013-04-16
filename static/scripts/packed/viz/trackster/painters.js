define(["libs/underscore"],function(_){var extend=_.extend;var BEFORE=1001,CONTAINS=1002,OVERLAP_START=1003,OVERLAP_END=1004,CONTAINED_BY=1005,AFTER=1006;var compute_overlap=function(first_region,second_region){var first_start=first_region[0],first_end=first_region[1],second_start=second_region[0],second_end=second_region[1],overlap;if(first_start<second_start){if(first_end<=second_start){overlap=BEFORE}else{if(first_end<=second_end){overlap=OVERLAP_START}else{overlap=CONTAINS}}}else{if(first_start>second_end){overlap=AFTER}else{if(first_end<=second_end){overlap=CONTAINED_BY}else{overlap=OVERLAP_END}}}return overlap};var is_overlap=function(first_region,second_region){var overlap=compute_overlap(first_region,second_region);return(overlap!==BEFORE&&overlap!==AFTER)};var dashedLine=function(ctx,x1,y1,x2,y2,dashLen){if(dashLen===undefined){dashLen=4}var dX=x2-x1;var dY=y2-y1;var dashes=Math.floor(Math.sqrt(dX*dX+dY*dY)/dashLen);var dashX=dX/dashes;var dashY=dY/dashes;var q;for(q=0;q<dashes;q++,x1+=dashX,y1+=dashY){if(q%2!==0){continue}ctx.fillRect(x1,y1,dashLen,1)}};var drawDownwardEquilateralTriangle=function(ctx,down_vertex_x,down_vertex_y,side_len){var x1=down_vertex_x-side_len/2,x2=down_vertex_x+side_len/2,y=down_vertex_y-Math.sqrt(side_len*3/2);ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.lineTo(down_vertex_x,down_vertex_y);ctx.lineTo(x1,y);ctx.strokeStyle=this.fillStyle;ctx.fill();ctx.stroke();ctx.closePath()};var Scaler=function(default_val){this.default_val=(default_val?default_val:1)};Scaler.prototype.gen_val=function(input){return this.default_val};var Painter=function(data,view_start,view_end,prefs,mode){this.data=data;this.view_start=view_start;this.view_end=view_end;this.prefs=extend({},this.default_prefs,prefs);this.mode=mode};Painter.prototype.default_prefs={};Painter.prototype.draw=function(ctx,width,height,w_scale){};var SummaryTreePainter=function(data,view_start,view_end,prefs,mode){Painter.call(this,data,view_start,view_end,prefs,mode)};SummaryTreePainter.prototype.default_prefs={show_counts:false};SummaryTreePainter.prototype.draw=function(ctx,width,height,w_scale){var view_start=this.view_start,points=this.data.data,max=(this.prefs.histogram_max?this.prefs.histogram_max:this.data.max),base_y=height,delta_x_px=Math.ceil(this.data.delta*w_scale);ctx.save();for(var i=0,len=points.length;i<len;i++){var x=Math.floor((points[i][0]-view_start)*w_scale);var y=points[i][1];if(!y){continue}var y_px=y/max*height;if(y!==0&&y_px<1){y_px=1}ctx.fillStyle=this.prefs.block_color;ctx.fillRect(x,base_y-y_px,delta_x_px,y_px);var text_padding_req_x=4;if(this.prefs.show_counts&&(ctx.measureText(y).width+text_padding_req_x)<delta_x_px){ctx.fillStyle=this.prefs.label_color;ctx.textAlign="center";ctx.fillText(y,x+(delta_x_px/2),10)}}ctx.restore()};var LinePainter=function(data,view_start,view_end,prefs,mode){Painter.call(this,data,view_start,view_end,prefs,mode);var i,len;if(this.prefs.min_value===undefined){var min_value=Infinity;for(i=0,len=this.data.length;i<len;i++){min_value=Math.min(min_value,this.data[i][1])}this.prefs.min_value=min_value}if(this.prefs.max_value===undefined){var max_value=-Infinity;for(i=0,len=this.data.length;i<len;i++){max_value=Math.max(max_value,this.data[i][1])}this.prefs.max_value=max_value}};LinePainter.prototype.default_prefs={min_value:undefined,max_value:undefined,mode:"Histogram",color:"#000",overflow_color:"#F66"};LinePainter.prototype.draw=function(ctx,width,height,w_scale){var in_path=false,min_value=this.prefs.min_value,max_value=this.prefs.max_value,vertical_range=max_value-min_value,height_px=height,view_start=this.view_start,mode=this.mode,data=this.data;ctx.save();var y_zero=Math.round(height+min_value/vertical_range*height);if(mode!=="Intensity"){ctx.fillStyle="#aaa";ctx.fillRect(0,y_zero,width,1)}ctx.beginPath();var x_scaled,y,delta_x_px;if(data.length>1){delta_x_px=Math.ceil((data[1][0]-data[0][0])*w_scale)}else{delta_x_px=10}var pref_color=parseInt(this.prefs.color.slice(1),16),pref_r=(pref_color&16711680)>>16,pref_g=(pref_color&65280)>>8,pref_b=pref_color&255;for(var i=0,len=data.length;i<len;i++){ctx.fillStyle=ctx.strokeStyle=this.prefs.color;x_scaled=Math.round((data[i][0]-view_start-0.5)*w_scale);y=data[i][1];var top_overflow=false,bot_overflow=false;if(y===null){if(in_path&&mode==="Filled"){ctx.lineTo(x_scaled,height_px)}in_path=false;continue}if(y<min_value){bot_overflow=true;y=min_value}else{if(y>max_value){top_overflow=true;y=max_value}}if(mode==="Histogram"){y=Math.round(y/vertical_range*height_px);ctx.fillRect(x_scaled,y_zero,delta_x_px,-y)}else{if(mode==="Intensity"){var saturation=(y-min_value)/vertical_range,new_r=Math.round(pref_r+(255-pref_r)*(1-saturation)),new_g=Math.round(pref_g+(255-pref_g)*(1-saturation)),new_b=Math.round(pref_b+(255-pref_b)*(1-saturation));ctx.fillStyle="rgb("+new_r+","+new_g+","+new_b+")";ctx.fillRect(x_scaled,0,delta_x_px,height_px)}else{y=Math.round(height_px-(y-min_value)/vertical_range*height_px);if(in_path){ctx.lineTo(x_scaled,y)}else{in_path=true;if(mode==="Filled"){ctx.moveTo(x_scaled,height_px);ctx.lineTo(x_scaled,y)}else{ctx.moveTo(x_scaled,y)}}}}ctx.fillStyle=this.prefs.overflow_color;if(top_overflow||bot_overflow){var overflow_x;if(mode==="Histogram"||mode==="Intensity"){overflow_x=delta_x_px}else{x_scaled-=2;overflow_x=4}if(top_overflow){ctx.fillRect(x_scaled,0,overflow_x,3)}if(bot_overflow){ctx.fillRect(x_scaled,height_px-3,overflow_x,3)}}ctx.fillStyle=this.prefs.color}if(mode==="Filled"){if(in_path){ctx.lineTo(x_scaled,y_zero);ctx.lineTo(0,y_zero)}ctx.fill()}else{ctx.stroke()}ctx.restore()};var FeaturePositionMapper=function(slot_height){this.feature_positions={};this.slot_height=slot_height;this.translation=0;this.y_translation=0};FeaturePositionMapper.prototype.map_feature_data=function(feature_data,slot,x_start,x_end){if(!this.feature_positions[slot]){this.feature_positions[slot]=[]}this.feature_positions[slot].push({data:feature_data,x_start:x_start,x_end:x_end})};FeaturePositionMapper.prototype.get_feature_data=function(x,y){var slot=Math.floor((y-this.y_translation)/this.slot_height),feature_dict;if(!this.feature_positions[slot]){return null}x+=this.translation;for(var i=0;i<this.feature_positions[slot].length;i++){feature_dict=this.feature_positions[slot][i];if(x>=feature_dict.x_start&&x<=feature_dict.x_end){return feature_dict.data}}};var FeaturePainter=function(data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler){Painter.call(this,data,view_start,view_end,prefs,mode);this.alpha_scaler=(alpha_scaler?alpha_scaler:new Scaler());this.height_scaler=(height_scaler?height_scaler:new Scaler())};FeaturePainter.prototype.default_prefs={block_color:"#FFF",connector_color:"#FFF"};extend(FeaturePainter.prototype,{get_required_height:function(rows_required,width){var required_height=this.get_row_height(),y_scale=required_height,mode=this.mode;if(mode==="no_detail"||mode==="Squish"||mode==="Pack"){required_height=rows_required*y_scale}return required_height+this.get_top_padding(width)+this.get_bottom_padding(width)},get_top_padding:function(width){return 0},get_bottom_padding:function(width){return Math.max(Math.round(this.get_row_height()/2),5)},draw:function(ctx,width,height,w_scale,slots){var data=this.data,view_start=this.view_start,view_end=this.view_end;ctx.save();ctx.fillStyle=this.prefs.block_color;ctx.textAlign="right";var y_scale=this.get_row_height(),feature_mapper=new FeaturePositionMapper(y_scale),x_draw_coords;for(var i=0,len=data.length;i<len;i++){var feature=data[i],feature_uid=feature[0],feature_start=feature[1],feature_end=feature[2],slot=(slots&&slots[feature_uid]!==undefined?slots[feature_uid]:null);if((feature_start<view_end&&feature_end>view_start)&&(this.mode==="Dense"||slot!==null)){x_draw_coords=this.draw_element(ctx,this.mode,feature,slot,view_start,view_end,w_scale,y_scale,width);feature_mapper.map_feature_data(feature,slot,x_draw_coords[0],x_draw_coords[1])}}ctx.restore();feature_mapper.y_translation=this.get_top_padding(width);return feature_mapper},draw_element:function(ctx,mode,feature,slot,tile_low,tile_high,w_scale,y_scale,width){console.log("WARNING: Unimplemented function.");return[0,0]}});var DENSE_TRACK_HEIGHT=10,NO_DETAIL_TRACK_HEIGHT=3,SQUISH_TRACK_HEIGHT=5,PACK_TRACK_HEIGHT=10,NO_DETAIL_FEATURE_HEIGHT=1,DENSE_FEATURE_HEIGHT=9,SQUISH_FEATURE_HEIGHT=3,PACK_FEATURE_HEIGHT=9,LABEL_SPACING=2,CONNECTOR_COLOR="#ccc";var LinkedFeaturePainter=function(data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler){FeaturePainter.call(this,data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler);this.draw_background_connector=true;this.draw_individual_connectors=false};extend(LinkedFeaturePainter.prototype,FeaturePainter.prototype,{get_row_height:function(){var mode=this.mode,height;if(mode==="Dense"){height=DENSE_TRACK_HEIGHT}else{if(mode==="no_detail"){height=NO_DETAIL_TRACK_HEIGHT}else{if(mode==="Squish"){height=SQUISH_TRACK_HEIGHT}else{height=PACK_TRACK_HEIGHT}}}return height},draw_element:function(ctx,mode,feature,slot,tile_low,tile_high,w_scale,y_scale,width){var feature_uid=feature[0],feature_start=feature[1],feature_end=feature[2],feature_name=feature[3],feature_strand=feature[4],f_start=Math.floor(Math.max(0,(feature_start-tile_low-0.5)*w_scale)),f_end=Math.ceil(Math.min(width,Math.max(0,(feature_end-tile_low-0.5)*w_scale))),draw_start=f_start,draw_end=f_end,y_center=(mode==="Dense"?0:(0+slot))*y_scale+this.get_top_padding(width),thickness,y_start,thick_start=null,thick_end=null,block_color=(!feature_strand||feature_strand==="+"||feature_strand==="."?this.prefs.block_color:this.prefs.reverse_strand_color);label_color=this.prefs.label_color;ctx.globalAlpha=this.alpha_scaler.gen_val(feature);if(mode==="Dense"){slot=1}if(mode==="no_detail"){ctx.fillStyle=block_color;ctx.fillRect(f_start,y_center+5,f_end-f_start,NO_DETAIL_FEATURE_HEIGHT)}else{var feature_ts=feature[5],feature_te=feature[6],feature_blocks=feature[7],full_height=true;if(feature_ts&&feature_te){thick_start=Math.floor(Math.max(0,(feature_ts-tile_low)*w_scale));thick_end=Math.ceil(Math.min(width,Math.max(0,(feature_te-tile_low)*w_scale)))}var thin_height,thick_height;if(mode==="Squish"){thin_height=1;thick_height=SQUISH_FEATURE_HEIGHT;full_height=false}else{if(mode==="Dense"){thin_height=5;thick_height=DENSE_FEATURE_HEIGHT}else{thin_height=5;thick_height=PACK_FEATURE_HEIGHT}}if(!feature_blocks){ctx.fillStyle=block_color;ctx.fillRect(f_start,y_center+1,f_end-f_start,thick_height);if(feature_strand&&full_height){if(feature_strand==="+"){ctx.fillStyle=ctx.canvas.manager.get_pattern("right_strand_inv")}else{if(feature_strand==="-"){ctx.fillStyle=ctx.canvas.manager.get_pattern("left_strand_inv")}}ctx.fillRect(f_start,y_center+1,f_end-f_start,thick_height)}}else{var cur_y_center,cur_height;if(mode==="Squish"||mode==="Dense"){cur_y_center=y_center+Math.floor(SQUISH_FEATURE_HEIGHT/2)+1;cur_height=1}else{if(feature_strand){cur_y_center=y_center;cur_height=thick_height}else{cur_y_center+=(SQUISH_FEATURE_HEIGHT/2)+1;cur_height=1}}if(this.draw_background_connector){if(mode==="Squish"||mode==="Dense"){ctx.fillStyle=CONNECTOR_COLOR}else{if(feature_strand){if(feature_strand==="+"){ctx.fillStyle=ctx.canvas.manager.get_pattern("right_strand")}else{if(feature_strand==="-"){ctx.fillStyle=ctx.canvas.manager.get_pattern("left_strand")}}}else{ctx.fillStyle=CONNECTOR_COLOR}}ctx.fillRect(f_start,cur_y_center,f_end-f_start,cur_height)}var start_and_height;for(var k=0,k_len=feature_blocks.length;k<k_len;k++){var block=feature_blocks[k],block_start=Math.floor(Math.max(0,(block[0]-tile_low-0.5)*w_scale)),block_end=Math.ceil(Math.min(width,Math.max((block[1]-tile_low-0.5)*w_scale))),last_block_start,last_block_end;if(block_start>block_end){continue}ctx.fillStyle=block_color;ctx.fillRect(block_start,y_center+(thick_height-thin_height)/2+1,block_end-block_start,thin_height);if(thick_start!==undefined&&feature_te>feature_ts&&!(block_start>thick_end||block_end<thick_start)){var block_thick_start=Math.max(block_start,thick_start),block_thick_end=Math.min(block_end,thick_end);ctx.fillRect(block_thick_start,y_center+1,block_thick_end-block_thick_start,thick_height);if(feature_blocks.length===1&&mode==="Pack"){if(feature_strand==="+"){ctx.fillStyle=ctx.canvas.manager.get_pattern("right_strand_inv")}else{if(feature_strand==="-"){ctx.fillStyle=ctx.canvas.manager.get_pattern("left_strand_inv")}}if(block_thick_start+14<block_thick_end){block_thick_start+=2;block_thick_end-=2}ctx.fillRect(block_thick_start,y_center+1,block_thick_end-block_thick_start,thick_height)}}if(this.draw_individual_connectors&&last_block_start){this.draw_connector(ctx,last_block_start,last_block_end,block_start,block_end,y_center)}last_block_start=block_start;last_block_end=block_end}if(mode==="Pack"){ctx.globalAlpha=1;ctx.fillStyle="white";var hscale_factor=this.height_scaler.gen_val(feature),new_height=Math.ceil(thick_height*hscale_factor),ws_height=Math.round((thick_height-new_height)/2);if(hscale_factor!==1){ctx.fillRect(f_start,cur_y_center+1,f_end-f_start,ws_height);ctx.fillRect(f_start,cur_y_center+thick_height-ws_height+1,f_end-f_start,ws_height)}}}ctx.globalAlpha=1;if(feature_name&&mode==="Pack"&&feature_start>tile_low){ctx.fillStyle=label_color;if(tile_low===0&&f_start-ctx.measureText(feature_name).width<0){ctx.textAlign="left";ctx.fillText(feature_name,f_end+LABEL_SPACING,y_center+8);draw_end+=ctx.measureText(feature_name).width+LABEL_SPACING}else{ctx.textAlign="right";ctx.fillText(feature_name,f_start-LABEL_SPACING,y_center+8);draw_start-=ctx.measureText(feature_name).width+LABEL_SPACING}}}ctx.globalAlpha=1;return[draw_start,draw_end]}});var ReadPainter=function(data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler,ref_seq,base_color_fn){FeaturePainter.call(this,data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler);this.ref_seq=(ref_seq?ref_seq.data:null);this.base_color_fn=base_color_fn};extend(ReadPainter.prototype,FeaturePainter.prototype,{get_row_height:function(){var height,mode=this.mode;if(mode==="Dense"){height=DENSE_TRACK_HEIGHT}else{if(mode==="Squish"){height=SQUISH_TRACK_HEIGHT}else{height=PACK_TRACK_HEIGHT;if(this.prefs.show_insertions){height*=2}}}return height},_parse_cigar:function(cigar_str){var cigar_ops="MIDNSHP=X";var blocks=[[0,0]],cur_block=blocks[0],base_pos=0,parsed_cigar=_.map(cigar_str.match(/[0-9]+[MIDNSHP=X]/g),function(op){var op_len=parseInt(op.slice(0,-1),10),op_char=op.slice(-1);if(op_char==="N"){if(cur_block[1]!==0){cur_block=[base_pos+op_len,base_pos+op_len];blocks.push(cur_block)}}else{if("ISHP".indexOf(op_char)===-1){cur_block[1]+=op_len;base_pos+=op_len}}return[cigar_ops.indexOf(op_char),op_len]});return{blocks:blocks,cigar:parsed_cigar}},draw_read:function(ctx,mode,w_scale,y_center,tile_low,tile_high,feature_start,cigar,strand,read_seq){ctx.textAlign="center";var tile_region=[tile_low,tile_high],base_offset=0,seq_offset=0,gap=Math.round(w_scale/2),char_width_px=ctx.canvas.manager.char_width_px,block_color=(strand==="+"?this.prefs.block_color:this.prefs.reverse_strand_color),pack_mode=(mode==="Pack");var draw_last=[];if(!cigar){cigar=[[0,read_seq.length]]}for(var cig_id=0,len=cigar.length;cig_id<len;cig_id++){var cig=cigar[cig_id],cig_op="MIDNSHP=X"[cig[0]],cig_len=cig[1];var seq_start=feature_start+base_offset,s_start=Math.floor(Math.max(-0.5*w_scale,(seq_start-tile_low-0.5)*w_scale)),s_end=Math.floor(Math.max(0,(seq_start+cig_len-tile_low-0.5)*w_scale));if(s_start===s_end){s_end+=1}switch(cig_op){case"H":break;case"S":seq_offset+=cig_len;break;case"M":case"=":case"X":if(is_overlap([seq_start,seq_start+cig_len],tile_region)){ctx.fillStyle=block_color;ctx.fillRect(s_start,y_center+(pack_mode?1:4),s_end-s_start,(pack_mode?PACK_FEATURE_HEIGHT:SQUISH_FEATURE_HEIGHT));var seq=read_seq.slice(seq_offset,seq_offset+cig_len),ref_char,read_char;for(var c=0,str_len=seq.length;c<str_len;c++){if(seq_start+c>=tile_low&&seq_start+c<=tile_high){ref_char=(this.ref_seq?this.ref_seq[seq_start-tile_low+c]:null);read_char=seq[c];if((ref_char&&(!this.prefs.show_differences||(read_char.toLowerCase!=="n"&&(ref_char.toLowerCase()!==read_char.toLowerCase()))))||(!ref_char&&!this.prefs.show_differences)){var c_start=Math.floor(Math.max(0,(seq_start+c-tile_low)*w_scale));ctx.fillStyle=this.base_color_fn(seq[c]);if(pack_mode&&w_scale>char_width_px){ctx.fillText(seq[c],c_start,y_center+9)}else{if(w_scale>0.05){ctx.fillRect(c_start-gap,y_center+(pack_mode?1:4),Math.max(1,Math.round(w_scale)),(pack_mode?PACK_FEATURE_HEIGHT:SQUISH_FEATURE_HEIGHT))}}}}}}seq_offset+=cig_len;base_offset+=cig_len;break;case"N":ctx.fillStyle=CONNECTOR_COLOR;ctx.fillRect(s_start,y_center+5,s_end-s_start,1);base_offset+=cig_len;break;case"D":ctx.fillStyle="black";ctx.fillRect(s_start,y_center+4,s_end-s_start,3);base_offset+=cig_len;break;case"P":break;case"I":var insert_x_coord=s_start-gap;if(is_overlap([seq_start,seq_start+cig_len],tile_region)){var seq=read_seq.slice(seq_offset,seq_offset+cig_len);if(this.prefs.show_insertions){var x_center=s_start-(s_end-s_start)/2;if((mode==="Pack"||this.mode==="Auto")&&read_seq!==undefined&&w_scale>char_width_px){ctx.fillStyle="yellow";ctx.fillRect(x_center-gap,y_center-9,s_end-s_start,9);draw_last[draw_last.length]={type:"triangle",data:[insert_x_coord,y_center+4,5]};ctx.fillStyle=CONNECTOR_COLOR;switch(compute_overlap([seq_start,seq_start+cig_len],tile_region)){case (OVERLAP_START):seq=seq.slice(tile_low-seq_start);break;case (OVERLAP_END):seq=seq.slice(0,seq_start-tile_high);break;case (CONTAINED_BY):break;case (CONTAINS):seq=seq.slice(tile_low-seq_start,seq_start-tile_high);break}for(var c=0,str_len=seq.length;c<str_len;c++){var c_start=Math.floor(Math.max(0,(seq_start+c-tile_low)*w_scale));ctx.fillText(seq[c],c_start-(s_end-s_start)/2,y_center)}}else{ctx.fillStyle="yellow";ctx.fillRect(x_center,y_center+(this.mode!=="Dense"?2:5),s_end-s_start,(mode!=="Dense"?SQUISH_FEATURE_HEIGHT:DENSE_FEATURE_HEIGHT))}}else{if((mode==="Pack"||this.mode==="Auto")&&read_seq!==undefined&&w_scale>char_width_px){draw_last.push({type:"text",data:[seq.length,insert_x_coord,y_center+9]})}else{}}}seq_offset+=cig_len;break}}ctx.fillStyle="yellow";var item,type,data;for(var i=0;i<draw_last.length;i++){item=draw_last[i];type=item.type;data=item.data;if(type==="text"){ctx.save();ctx.font="bold "+ctx.font;ctx.fillText(data[0],data[1],data[2]);ctx.restore()}else{if(type==="triangle"){drawDownwardEquilateralTriangle(ctx,data[0],data[1],data[2])}}}},draw_element:function(ctx,mode,feature,slot,tile_low,tile_high,w_scale,y_scale,width){var feature_uid=feature[0],feature_start=feature[1],feature_end=feature[2],feature_name=feature[3],f_start=Math.floor(Math.max(-0.5*w_scale,(feature_start-tile_low-0.5)*w_scale)),f_end=Math.ceil(Math.min(width,Math.max(0,(feature_end-tile_low-0.5)*w_scale))),y_center=(mode==="Dense"?0:(0+slot))*y_scale,label_color=this.prefs.label_color;if(feature[5] instanceof Array){var b1_start=Math.floor(Math.max(0,(feature[4][0]-tile_low)*w_scale)),b1_end=Math.ceil(Math.min(width,Math.max(0,(feature[4][1]-tile_low)*w_scale))),b2_start=Math.floor(Math.max(0,(feature[5][0]-tile_low)*w_scale)),b2_end=Math.ceil(Math.min(width,Math.max(0,(feature[5][1]-tile_low)*w_scale))),connector=true;if(feature[4][1]>=tile_low&&feature[4][0]<=tile_high&&feature[4][2]){this.draw_read(ctx,mode,w_scale,y_center,tile_low,tile_high,feature[4][0],feature[4][2],feature[4][3],feature[4][4])}else{connector=false}if(feature[5][1]>=tile_low&&feature[5][0]<=tile_high&&feature[5][2]){this.draw_read(ctx,mode,w_scale,y_center,tile_low,tile_high,feature[5][0],feature[5][2],feature[5][3],feature[5][4])}else{connector=false}if(connector&&b2_start>b1_end){ctx.fillStyle=CONNECTOR_COLOR;dashedLine(ctx,b1_end,y_center+5,b2_start,y_center+5)}}else{this.draw_read(ctx,mode,w_scale,y_center,tile_low,tile_high,feature_start,feature[4],feature[5],feature[6])}if(mode==="Pack"&&feature_start>=tile_low&&feature_name!=="."){ctx.fillStyle=this.prefs.label_color;if(tile_low===0&&f_start-ctx.measureText(feature_name).width<0){ctx.textAlign="left";ctx.fillText(feature_name,f_end+LABEL_SPACING,y_center+8)}else{ctx.textAlign="right";ctx.fillText(feature_name,f_start-LABEL_SPACING,y_center+8)}}return[0,0]}});var RefBasedReadPainter=function(data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler,ref_seq,base_color_fn){ReadPainter.call(this,data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler,ref_seq,base_color_fn)};extend(RefBasedReadPainter.prototype,ReadPainter.prototype,FeaturePainter,{draw_read:function(ctx,mode,w_scale,y_center,tile_low,tile_high,feature_start,cigar,strand,read_seq){ctx.textAlign="center";var tile_region=[tile_low,tile_high],base_offset=0,seq_offset=0,gap=Math.round(w_scale/2),char_width_px=ctx.canvas.manager.char_width_px,block_color=(strand==="+"?this.prefs.block_color:this.prefs.reverse_strand_color),pack_mode=(mode==="Pack"),drawing_blocks=[];var draw_last=[];var t=this._parse_cigar(cigar);cigar=t.cigar;drawing_blocks=t.blocks;for(var i=0;i<drawing_blocks.length;i++){var block=drawing_blocks[i];if(is_overlap([feature_start+block[0],feature_start+block[1]],tile_region)){var s_start=Math.floor(Math.max(-0.5*w_scale,(feature_start+block[0]-tile_low-0.5)*w_scale)),s_end=Math.floor(Math.max(0,(feature_start+block[1]-tile_low-0.5)*w_scale));if(s_start===s_end){s_end+=1}ctx.fillStyle=block_color;ctx.fillRect(s_start,y_center+(pack_mode?1:4),s_end-s_start,(pack_mode?PACK_FEATURE_HEIGHT:SQUISH_FEATURE_HEIGHT))}}for(var cig_id=0,len=cigar.length;cig_id<len;cig_id++){var cig=cigar[cig_id],cig_op="MIDNSHP=X"[cig[0]],cig_len=cig[1];var seq_start=feature_start+base_offset,s_start=Math.floor(Math.max(0,-0.5*w_scale,(seq_start-tile_low-0.5)*w_scale)),s_end=Math.floor(Math.max(0,(seq_start+cig_len-tile_low-0.5)*w_scale));if(s_start===s_end){s_end+=1}switch(cig_op){case"H":case"S":case"P":break;case"M":base_offset+=cig_len;break;case"=":case"X":if(is_overlap([seq_start,seq_start+cig_len],tile_region)){var cur_seq="";if(cig_op==="X"){cur_seq=read_seq.slice(seq_offset,seq_offset+cig_len)}else{if(this.ref_seq){cur_seq=this.ref_seq.slice(Math.max(0,seq_start-tile_low),Math.min(seq_start-tile_low+cig_len,tile_high-tile_low))}}var start_pos=Math.max(seq_start,tile_low);for(var c=0;c<cur_seq.length;c++){if(cur_seq&&!this.prefs.show_differences||cig_op==="X"){var c_start=Math.floor(Math.max(0,(start_pos+c-tile_low)*w_scale));ctx.fillStyle=this.base_color_fn(cur_seq[c]);if(pack_mode&&w_scale>char_width_px){ctx.fillText(cur_seq[c],c_start,y_center+9)}else{if(w_scale>0.05){ctx.fillRect(c_start-gap,y_center+(pack_mode?1:4),Math.max(1,Math.round(w_scale)),(pack_mode?PACK_FEATURE_HEIGHT:SQUISH_FEATURE_HEIGHT))}}}}}if(cig_op==="X"){seq_offset+=cig_len}base_offset+=cig_len;break;case"N":ctx.fillStyle=CONNECTOR_COLOR;ctx.fillRect(s_start,y_center+5,s_end-s_start,1);base_offset+=cig_len;break;case"D":ctx.fillStyle="black";ctx.fillRect(s_start,y_center+4,s_end-s_start,3);base_offset+=cig_len;break;case"I":var insert_x_coord=s_start-gap;if(is_overlap([seq_start,seq_start+cig_len],tile_region)){var seq=read_seq.slice(seq_offset,seq_offset+cig_len);if(this.prefs.show_insertions){var x_center=s_start-(s_end-s_start)/2;if((mode==="Pack"||this.mode==="Auto")&&read_seq!==undefined&&w_scale>char_width_px){ctx.fillStyle="yellow";ctx.fillRect(x_center-gap,y_center-9,s_end-s_start,9);draw_last[draw_last.length]={type:"triangle",data:[insert_x_coord,y_center+4,5]};ctx.fillStyle=CONNECTOR_COLOR;switch(compute_overlap([seq_start,seq_start+cig_len],tile_region)){case (OVERLAP_START):seq=seq.slice(tile_low-seq_start);break;case (OVERLAP_END):seq=seq.slice(0,seq_start-tile_high);break;case (CONTAINED_BY):break;case (CONTAINS):seq=seq.slice(tile_low-seq_start,seq_start-tile_high);break}for(var c=0,str_len=seq.length;c<str_len;c++){var c_start=Math.floor(Math.max(0,(seq_start+c-tile_low)*w_scale));ctx.fillText(seq[c],c_start-(s_end-s_start)/2,y_center)}}else{ctx.fillStyle="yellow";ctx.fillRect(x_center,y_center+(this.mode!=="Dense"?2:5),s_end-s_start,(mode!=="Dense"?SQUISH_FEATURE_HEIGHT:DENSE_FEATURE_HEIGHT))}}else{if((mode==="Pack"||this.mode==="Auto")&&read_seq!==undefined&&w_scale>char_width_px){draw_last.push({type:"text",data:[seq.length,insert_x_coord,y_center+9]})}else{}}}seq_offset+=cig_len;break}}ctx.fillStyle="yellow";var item,type,data;for(var i=0;i<draw_last.length;i++){item=draw_last[i];type=item.type;data=item.data;if(type==="text"){ctx.save();ctx.font="bold "+ctx.font;ctx.fillText(data[0],data[1],data[2]);ctx.restore()}else{if(type==="triangle"){drawDownwardEquilateralTriangle(ctx,data[0],data[1],data[2])}}}}});var ArcLinkedFeaturePainter=function(data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler){LinkedFeaturePainter.call(this,data,view_start,view_end,prefs,mode,alpha_scaler,height_scaler);this.longest_feature_length=this.calculate_longest_feature_length();this.draw_background_connector=false;this.draw_individual_connectors=true};extend(ArcLinkedFeaturePainter.prototype,FeaturePainter.prototype,LinkedFeaturePainter.prototype,{calculate_longest_feature_length:function(){var longest_feature_length=0;for(var i=0,len=this.data.length;i<len;i++){var feature=this.data[i],feature_start=feature[1],feature_end=feature[2];longest_feature_length=Math.max(longest_feature_length,feature_end-feature_start)}return longest_feature_length},get_top_padding:function(width){var view_range=this.view_end-this.view_start,w_scale=width/view_range;return Math.min(128,Math.ceil((this.longest_feature_length/2)*w_scale))},draw_connector:function(ctx,block1_start,block1_end,block2_start,block2_end,y_center){var x_center=(block1_end+block2_start)/2,radius=block2_start-x_center;var angle1=Math.PI,angle2=0;if(radius>0){ctx.beginPath();ctx.arc(x_center,y_center,block2_start-x_center,Math.PI,0);ctx.stroke()}}});var Color=function(rgb,a){if(Array.isArray(rgb)){this.rgb=rgb}else{if(rgb.length==6){this.rgb=rgb.match(/.{2}/g).map(function(c){return parseInt(c,16)})}else{if(rgb.length==7){this.rgb=rgb.substring(1,7).match(/.{2}/g).map(function(c){return parseInt(c,16)})}else{this.rgb=rgb.split("").map(function(c){return parseInt(c+c,16)})}}}this.alpha=typeof(a)==="number"?a:1};Color.prototype={eval:function(){return this},toCSS:function(){if(this.alpha<1){return"rgba("+this.rgb.map(function(c){return Math.round(c)}).concat(this.alpha).join(", ")+")"}else{return"#"+this.rgb.map(function(i){i=Math.round(i);i=(i>255?255:(i<0?0:i)).toString(16);return i.length===1?"0"+i:i}).join("")}},toHSL:function(){var r=this.rgb[0]/255,g=this.rgb[1]/255,b=this.rgb[2]/255,a=this.alpha;var max=Math.max(r,g,b),min=Math.min(r,g,b);var h,s,l=(max+min)/2,d=max-min;if(max===min){h=s=0}else{s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break}h/=6}return{h:h*360,s:s,l:l,a:a}},toARGB:function(){var argb=[Math.round(this.alpha*255)].concat(this.rgb);return"#"+argb.map(function(i){i=Math.round(i);i=(i>255?255:(i<0?0:i)).toString(16);return i.length===1?"0"+i:i}).join("")},mix:function(color2,weight){color1=this;var p=weight;var w=p*2-1;var a=color1.toHSL().a-color2.toHSL().a;var w1=(((w*a==-1)?w:(w+a)/(1+w*a))+1)/2;var w2=1-w1;var rgb=[color1.rgb[0]*w1+color2.rgb[0]*w2,color1.rgb[1]*w1+color2.rgb[1]*w2,color1.rgb[2]*w1+color2.rgb[2]*w2];var alpha=color1.alpha*p+color2.alpha*(1-p);return new Color(rgb,alpha)}};var LinearRamp=function(start_color,end_color,start_value,end_value){this.start_color=new Color(start_color);this.end_color=new Color(end_color);this.start_value=start_value;this.end_value=end_value;this.value_range=end_value-start_value};LinearRamp.prototype.map_value=function(value){value=Math.max(value,this.start_value);value=Math.min(value,this.end_value);value=(value-this.start_value)/this.value_range;return this.start_color.mix(this.end_color,1-value).toCSS()};var SplitRamp=function(start_color,middle_color,end_color,start_value,end_value){this.positive_ramp=new LinearRamp(middle_color,end_color,0,end_value);this.negative_ramp=new LinearRamp(middle_color,start_color,0,-start_value);this.start_value=start_value;this.end_value=end_value};SplitRamp.prototype.map_value=function(value){value=Math.max(value,this.start_value);value=Math.min(value,this.end_value);if(value>=0){return this.positive_ramp.map_value(value)}else{return this.negative_ramp.map_value(-value)}};var DiagonalHeatmapPainter=function(data,view_start,view_end,prefs,mode){Painter.call(this,data,view_start,view_end,prefs,mode);var i,len;if(this.prefs.min_value===undefined){var min_value=Infinity;for(i=0,len=this.data.length;i<len;i++){min_value=Math.min(min_value,this.data[i][5])}this.prefs.min_value=min_value}if(this.prefs.max_value===undefined){var max_value=-Infinity;for(i=0,len=this.data.length;i<len;i++){max_value=Math.max(max_value,this.data[i][5])}this.prefs.max_value=max_value}};DiagonalHeatmapPainter.prototype.default_prefs={min_value:undefined,max_value:undefined,mode:"Heatmap",pos_color:"#FF8C00",neg_color:"#4169E1"};DiagonalHeatmapPainter.prototype.draw=function(ctx,width,height,w_scale){var min_value=this.prefs.min_value,max_value=this.prefs.max_value,value_range=max_value-min_value,height_px=height,view_start=this.view_start,mode=this.mode,data=this.data,invsqrt2=1/Math.sqrt(2);var ramp=(new SplitRamp(this.prefs.neg_color,"#FFFFFF",this.prefs.pos_color,min_value,max_value));var d,s1,e1,s2,e2,value;var scale=function(p){return(p-view_start)*w_scale};ctx.save();ctx.rotate(-45*Math.PI/180);ctx.scale(invsqrt2,invsqrt2);for(var i=0,len=data.length;i<len;i++){d=data[i];s1=scale(d[1]);e1=scale(d[2]);s2=scale(d[4]);e2=scale(d[5]);value=d[6];ctx.fillStyle=(ramp.map_value(value));ctx.fillRect(s1,s2,(e1-s1),(e2-s2))}ctx.restore()};var VariantPainter=function(data,view_start,view_end,prefs,mode,base_color_fn){Painter.call(this,data,view_start,view_end,prefs,mode);this.base_color_fn=base_color_fn;this.divider_height=1};extend(VariantPainter.prototype,Painter.prototype,{get_row_height:function(){var mode=this.mode,height;if(mode==="Dense"){height=DENSE_TRACK_HEIGHT}else{if(mode==="Squish"){height=SQUISH_TRACK_HEIGHT}else{height=PACK_TRACK_HEIGHT}}return height},get_required_height:function(rows_required,width){var height=this.prefs.summary_height;if(this.prefs.show_sample_data){height+=this.divider_height;if(this.data.length!==0){height+=(this.data[0][7].match(/,/g).length+1)*this.get_row_height()}}return height},draw:function(ctx,width,height,w_scale){var locus_data,pos,id,ref,alt,qual,filter,sample_gts,allele_counts,variant,draw_x_start,char_x_start,draw_y_start,genotype,base_px=Math.max(1,Math.floor(w_scale)),row_height=(this.mode==="Squish"?SQUISH_TRACK_HEIGHT:PACK_TRACK_HEIGHT),feature_height=(w_scale<0.1?row_height:(this.mode==="Squish"?SQUISH_FEATURE_HEIGHT:PACK_FEATURE_HEIGHT)),j;if(this.prefs.show_sample_data){ctx.fillStyle="#DDDDDD";ctx.globalAlpha=1;ctx.fillRect(0,this.prefs.summary_height-this.divider_height,width,this.divider_height)}ctx.textAlign="center";for(var i=0;i<this.data.length;i++){locus_data=this.data[i];pos=locus_data[1];alt=locus_data[4].split(",");sample_gts=locus_data[7].split(",");allele_counts=locus_data.slice(8);draw_x_start=Math.floor(Math.max(-0.5*w_scale,(pos-this.view_start-0.5)*w_scale));char_x_start=Math.floor(Math.max(0,(pos-this.view_start)*w_scale));ctx.fillStyle="#AAAAAA";ctx.fillRect(draw_x_start,0,base_px,this.prefs.summary_height);draw_y_start=this.prefs.summary_height;for(j=0;j<alt.length;j++){ctx.fillStyle=this.base_color_fn(alt[j]);allele_frac=allele_counts/sample_gts.length;draw_height=Math.ceil(this.prefs.summary_height*allele_frac);ctx.fillRect(draw_x_start,draw_y_start-draw_height,base_px,draw_height);draw_y_start-=draw_height}if(!this.prefs.show_sample_data){continue}draw_y_start=this.prefs.summary_height+this.divider_height;for(j=0;j<sample_gts.length;j++,draw_y_start+=row_height){genotype=(sample_gts[j]?sample_gts[j].split(/\/|\|/):["0","0"]);variant=null;if(genotype[0]===genotype[1]){if(genotype[0]==="."){}else{if(genotype[0]!=="0"){variant=alt[parseInt(genotype[0],10)-1];ctx.globalAlpha=1}}}else{variant=(genotype[0]!=="0"?genotype[0]:genotype[1]);variant=alt[parseInt(variant,10)-1];ctx.globalAlpha=0.4}if(variant){ctx.fillStyle=this.base_color_fn(variant);if(this.mode==="Squish"||w_scale<ctx.canvas.manager.char_width_px){ctx.fillRect(draw_x_start,draw_y_start+1,base_px,feature_height)}else{ctx.fillText(variant,char_x_start,draw_y_start+row_height)}}}}}});return{Scaler:Scaler,SummaryTreePainter:SummaryTreePainter,LinePainter:LinePainter,LinkedFeaturePainter:LinkedFeaturePainter,ReadPainter:ReadPainter,RefBasedReadPainter:RefBasedReadPainter,ArcLinkedFeaturePainter:ArcLinkedFeaturePainter,DiagonalHeatmapPainter:DiagonalHeatmapPainter,VariantPainter:VariantPainter}});