sap.ui.define([
		"tt.ZHR_TT_ESS_GIRIS_CIKIS/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("tt.ZHR_TT_ESS_GIRIS_CIKIS.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);