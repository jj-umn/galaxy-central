<%
    hda_dict = trans.security.encode_dict_ids( hda.to_dict() )

    config = query_args
    title  = "Scatterplot of '" + hda.name + "'"
    info   = hda.info

    visualization = context.get( 'visualization' )
    if visualization is not None:
        config = visualization.latest_revision.config
        config.update( query_args )
        title  = visualization.title
        info   = config.get( 'description', info )

    config[ 'type' ] = 'scatterplot'

    # optionally bootstrap data from dprov
    ##data = list( hda.datatype.dataset_column_dataprovider( hda, limit=10000 ) )
%>
## ----------------------------------------------------------------------------

<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>${hda.name} | ${visualization_name}</title>

## ----------------------------------------------------------------------------
<link type="text/css" rel="Stylesheet" media="screen" href="/static/style/base.css">
<link type="text/css" rel="Stylesheet" media="screen" href="/static/style/jquery-ui/smoothness/jquery-ui.css">

<link type="text/css" rel="Stylesheet" media="screen" href="/plugins/visualizations/scatterplot/static/scatterplot.css">

## ----------------------------------------------------------------------------
<script type="text/javascript" src="/static/scripts/libs/jquery/jquery.js"></script>
<script type="text/javascript" src="/static/scripts/libs/jquery/jquery.migrate.js"></script>
<script type="text/javascript" src="/static/scripts/libs/jquery/jquery-ui.js"></script>
<script type="text/javascript" src="/static/scripts/libs/bootstrap.js"></script>
<script type="text/javascript" src="/static/scripts/libs/underscore.js"></script>
<script type="text/javascript" src="/static/scripts/libs/backbone/backbone.js"></script>
<script type="text/javascript" src="/static/scripts/libs/handlebars.runtime.js"></script>
<script type="text/javascript" src="/static/scripts/libs/d3.js"></script>

<script type="text/javascript" src="/static/scripts/mvc/base-mvc.js"></script>
<script type="text/javascript" src="/static/scripts/mvc/visualization/visualization-model.js"></script>

<script type="text/javascript" src="/plugins/visualizations/scatterplot/static/scatterplot-edit.js"></script>
</head>

## ----------------------------------------------------------------------------
<body>
%if not embedded:
## dataset info: only show if on own page
<div class="chart-header">
    <h2>${title}</h2>
    <p>${info}</p>
</div>

<div class="scatterplot-editor"></div>
<script type="text/javascript">
$(function(){
    var model   = new ScatterplotModel( ${h.to_json_string( config )} ),
        hdaJson = ${h.to_json_string( hda_dict )},
        editor  = new ScatterplotConfigEditor({
            el      : $( '.scatterplot-editor' ).attr( 'id', 'scatterplot-editor-hda-' + hdaJson.id ),
            model   : model,
            dataset : hdaJson
        }).render();
    window.editor = editor;
    // uncomment to auto render for development
    //$( '.render-button:visible' ).click();
});

</script>
%endif

</body>
