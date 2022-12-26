/*global location*/
sap.ui.define([
	"tt.ZHR_YEMEK_UCRET/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"tt/ZHR_YEMEK_UCRET/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(
	BaseController,
	JSONModel,
	History,
	formatter,
	Filter,
	FilterOperator
) {
	"use strict";

	return BaseController.extend("tt.ZHR_YEMEK_UCRET.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			/*				var oViewModel = this.getModel("objectView"),
								oShareDialog = sap.ui.getCore().createComponent({
									name: "sap.collaboration.components.fiori.sharing.dialog",
									settings: {
										object:{
											id: location.href,
											share: oViewModel.getProperty("/shareOnJamTitle")
										}
									}
								});
							oShareDialog.open();*/
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {

			//var vPernr = oEvent.getParameter("arguments").objectId;
			var vKapsam = oEvent.getParameter("arguments").kapsam;
			if (vKapsam === 'D') {
				this.onSetVisibleColoum(true, false);
			} else {
				this.onSetVisibleColoum(false, true);
			}
			if (sap.ui.getCore().getModel("detayModel") !== undefined) {
				var detayModel = sap.ui.getCore().getModel("detayModel").getData();
				
						var fields = ["DevamsizGun",
					"DevamsizGunP",
					"AltigunP",
		
					"Altigun",
					"HarcirahGun",
					"MesaiGun"
				];

				for (var i = 0; i < fields.length; i++) {
					var field = fields[i];

					var x1 = parseInt(detayModel[0][field]);
					if (x1 > 0) {
						detayModel[0][field] = x1;
					} else {
						detayModel[0][field] = "";
					}

				}



				this.getView().setModel(new JSONModel(detayModel), "detayModel");

		
				this.getView().setModel(new JSONModel({
					Kapsam: detayModel[0].Kapsam
				}), "header");
			}
			/*var filters = [new Filter("Pernr", FilterOperator.EQ, vPernr)];
			this.getView().getModel().read("/YemekUcretiDetayListSet", {
				filters: filters,
				urlParameters: null,
				sorters: null,
				async: true,
				success: function(oData) {
					var oJSONModel = new JSONModel();
					oJSONModel.setData(oData.results);
					this.getView().setModel(oJSONModel, "detayModel");
					var countModel = new JSONModel({
						count: oData.results.length
					});
					this.getView().setModel(countModel, "countModel");
				}.bind(this),
				error: function(oError) {}
			});*/
			/*	this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("YemekUcretiDetayListSet", {
						Pernr: sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));*/
		},

		onSetVisibleColoum: function(vKDisi, vKIci) {

			var oView = this.getView();

			oView.byId("idFunDetay").setVisible(vKDisi);
			oView.byId("idToplamYemek").setVisible(vKIci);

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			/*				var oView = this.getView(),
								oViewModel = this.getModel("objectView"),
								oElementBinding = oView.getElementBinding();

							// No data for the binding
							if (!oElementBinding.getBoundContext()) {
								this.getRouter().getTargets().display("objectNotFound");
								return;
							}

							var oResourceBundle = this.getResourceBundle(),
								oObject = oView.getBindingContext().getObject(),
								sObjectId = oObject.Pernr,
								sObjectName = oObject.Kapsam;

							oViewModel.setProperty("/busy", false);
							// Add the object page to the flp routing history
							this.addHistoryEntry({
								title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
								icon: "sap-icon://enter-more",
								intent: "#YemekUcreti-display&/PersYemekUcretSet/" + sObjectId
							});

							oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
							oViewModel.setProperty("/shareOnJamTitle", sObjectName);
							oViewModel.setProperty("/shareSendEmailSubject",
							oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
							oViewModel.setProperty("/shareSendEmailMessage",
							oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));*/
		}

	});

});