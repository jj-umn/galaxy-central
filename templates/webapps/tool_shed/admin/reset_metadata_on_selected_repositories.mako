<%inherit file="/base.mako"/>
<%namespace file="/message.mako" import="render_msg" />
<%namespace file="/webapps/tool_shed/common/common.mako" import="common_misc_javascripts" />

<%def name="javascripts()">
    ${parent.javascripts()}
    ${common_misc_javascripts()}
</%def>

%if message:
    ${render_msg( message, status )}
%endif

<div class="warningmessage">
    Resetting metadata may take a while because this process clones each change set in each selected repository's change log to a temporary location on disk.
    Wait until this page redirects after clicking the <b>Reset metadata on selected repositories</b> button, as doing anything else will not be helpful.  Watch 
    the tool shed paster log to pass the time if necessary.
</div>

<div class="toolForm">
    <div class="toolFormTitle">Reset all metadata on each selected repository</div>
        <form name="reset_metadata_on_selected_repositories" id="reset_metadata_on_selected_repositories" action="${h.url_for( controller='admin', action='reset_metadata_on_selected_repositories_in_tool_shed' )}" method="post" >
            <div class="form-row">
                Check each repository for which you want to reset metadata.  Repository names are followed by owners in parentheses.
            </div>
            <div style="clear: both"></div>
            <div class="form-row">
                <input type="checkbox" id="checkAll" name="select_all_repositories_checkbox" value="true" onclick="checkAllFields('repository_ids');"/><input type="hidden" name="select_all_repositories_checkbox" value="true"/><b>Select/unselect all repositories</b>
            </div>
            <div style="clear: both"></div>
            <div class="form-row">
                ${repositories_select_field.get_html()}
            </div>
            <div style="clear: both"></div>
            <div class="form-row">
                <input type="submit" name="reset_metadata_on_selected_repositories_button" value="Reset metadata on selected repositories"/>
            </div>
        </form>
    </div>
</div>