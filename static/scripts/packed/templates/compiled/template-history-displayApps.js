(function(){var b=Handlebars.template,a=Handlebars.templates=Handlebars.templates||{};a["template-history-displayApps"]=b(function(h,m,g,l,k){g=g||h.helpers;var d,i="function",j=this.escapeExpression,o=this,n=g.blockHelperMissing;function f(t,s){var q="",r,p;q+="\n    ";p=g.label;if(p){r=p.call(t,{hash:{}})}else{r=t.label;r=typeof r===i?r():r}q+=j(r)+"\n    ";r=t.links;r=g.each.call(t,r,{hash:{},inverse:o.noop,fn:o.program(2,e,s)});if(r||r===0){q+=r}q+="\n    <br />\n";return q}function e(t,s){var q="",r,p;q+='\n        <a target="';p=g.target;if(p){r=p.call(t,{hash:{}})}else{r=t.target;r=typeof r===i?r():r}q+=j(r)+'" href="';p=g.href;if(p){r=p.call(t,{hash:{}})}else{r=t.href;r=typeof r===i?r():r}q+=j(r)+'">';p=g.local;if(p){r=p.call(t,{hash:{},inverse:o.noop,fn:o.program(3,c,s)})}else{r=t.local;r=typeof r===i?r():r}if(!g.local){r=n.call(t,r,{hash:{},inverse:o.noop,fn:o.program(3,c,s)})}if(r||r===0){q+=r}q+="</a>\n    ";return q}function c(s,r){var q,p;p=g.text;if(p){q=p.call(s,{hash:{}})}else{q=s.text;q=typeof q===i?q():q}return j(q)}d=m.displayApps;d=g.each.call(m,d,{hash:{},inverse:o.noop,fn:o.program(1,f,k)});if(d||d===0){return d}else{return""}})})();