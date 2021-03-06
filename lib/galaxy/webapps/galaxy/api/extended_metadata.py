"""
API operations on annotations.
"""
import logging
from galaxy import web
from galaxy.web.base.controller import  BaseAPIController, UsesHistoryMixin, UsesLibraryMixinItems, UsesHistoryDatasetAssociationMixin, UsesStoredWorkflowMixin, UsesExtendedMetadataMixin, HTTPNotImplemented

log = logging.getLogger( __name__ )

class BaseExtendedMetadataController( BaseAPIController, UsesExtendedMetadataMixin, UsesHistoryMixin, UsesLibraryMixinItems, UsesHistoryDatasetAssociationMixin, UsesStoredWorkflowMixin ):

    @web.expose_api
    def index( self, trans, **kwd ):
        idnum = kwd[self.exmeta_item_id]
        item = self._get_item_from_id(trans, idnum, check_writable=False)
        if item is not None:
            ex_meta = self.get_item_extended_metadata_obj( trans, item )
            if ex_meta is not None:
                return ex_meta.data

    @web.expose_api
    def create( self, trans, payload, **kwd ):
        idnum = kwd[self.exmeta_item_id]
        item = self._get_item_from_id(trans, idnum, check_writable=True)
        if item is not None:
            ex_obj = self.get_item_extended_metadata_obj(trans, item)
            if ex_obj is not None:
                self.unset_item_extended_metadata_obj(trans, item)
                self.delete_extended_metadata(trans, ex_obj)
            ex_obj = self.create_extended_metadata(trans, payload)
            self.set_item_extended_metadata_obj(trans, item, ex_obj)

    @web.expose_api
    def delete( self, trans, **kwd ):
        idnum = kwd[self.tagged_item_id]
        item = self._get_item_from_id(trans, idnum, check_writable=True)
        if item is not None:
            ex_obj = self.get_item_extended_metadata_obj(trans, item)
            if ex_obj is not None:
                self.unset_item_extended_metadata_obj(trans, item)
                self.delete_extended_metadata(trans, ex_obj)

    @web.expose_api
    def undelete( self, trans, **kwd ):
        raise HTTPNotImplemented()

class LibraryDatasetExtendMetadataController(BaseExtendedMetadataController):
    controller_name = "library_dataset_extended_metadata"
    exmeta_item_id = "library_content_id"
    def _get_item_from_id(self, trans, idstr, check_writable=True):
        if check_writable:
            item = self.get_library_dataset_dataset_association( trans, idstr)
            if trans.app.security_agent.can_modify_library_item( trans.get_current_user_roles(), item ):
                return item
        else:
            item = self.get_library_dataset_dataset_association( trans, idstr)
            if trans.app.security_agent.can_access_library_item( trans.get_current_user_roles(), item, trans.user ):
                return item
        return None

class HistoryDatasetExtendMetadataController(BaseExtendedMetadataController):
    controller_name = "history_dataset_extended_metadata"
    exmeta_item_id = "history_content_id"
    def _get_item_from_id(self, trans, idstr, check_writable=True):
        if check_writable:
            return self.get_dataset( trans, idstr,  check_ownership=True, check_accessible=True, check_state=True )
        else:
            return self.get_dataset( trans, idstr,  check_ownership=False, check_accessible=True, check_state=True )
