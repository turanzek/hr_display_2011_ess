sap.ui.define([
		"tt.ZHR_YEMEK_UCRET/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("tt.ZHR_YEMEK_UCRET.controller.NotFound", {

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