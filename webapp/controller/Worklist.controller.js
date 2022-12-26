/*global location history */
sap.ui.define([
	"tt.ZHR_YEMEK_UCRET/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"tt/ZHR_YEMEK_UCRET/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("tt.ZHR_YEMEK_UCRET.controller.Worklist", {

		formatter: formatter,
		_vKapsam: "",

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});

			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#YemekUcreti-display"
			}, true);

			var vBegda = new Date(); //gün tarihinden 90 gün geri gidiliyor
			vBegda = Math.abs(vBegda.getTime() - 1000 * 60 * 60 * 24 * 90);

			var oModel = new JSONModel();
			oModel.setData({
				delimiter: "-",
				dateValue: new Date(vBegda),
				secondDateValue: new Date(),
				dateFormat: "dd.MM.yyyy"
			});
			this.getView().setModel(oModel, "talepFilterModel");

			var headerModel = new JSONModel();
			this.getView().setModel(headerModel, "header");
		},

		onBeforeRendering: function(oEvent) {
			var page = this.byId("page");

			var filters = [new Filter("Fbegda", FilterOperator.BT,
				this.getView().byId("idTarih").getDateValue(),
				this.getView().byId("idTarih").getSecondDateValue())];

			page.setBusy(true);

			this.getView().getModel().read("/YemekUcretiListSet", {
				filters: filters,
				urlParameters: null,
				sorters: null,
				async: true,
				success: function(oData) {
					if (oData.results.length > 0) {
						this._vKapsam = oData.results[0].Kapsam;
						if (this._vKapsam === 'D') {
							this.onSetVisibleColoum(true, false);
						} else {
							this.onSetVisibleColoum(false, true);
						}
						var oJSONModel = new JSONModel();
						oJSONModel.setData(oData.results);
						this.getView().setModel(oJSONModel, "detayModel");
						this.onBilgiMetni();

						var headerModel = this.getView().getModel("header");
						headerModel.setProperty("/Kapsam", oData.results[0].Kapsam);
					}
					page.setBusy(false);

				}.bind(this),
				error: function(oError) {
					var jsonError = JSON.parse(oError.responseText);
					sap.m.MessageBox.alert(jsonError.error.message.value);
					page.setBusy(false);
				}
			});

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},
		onBilgiMetni: function() {
			var page = this.byId("page");

			var filters = [new Filter("Kapsam", FilterOperator.EQ, this._vKapsam)];

			this.getView().getModel().read("/BilgilendirmeMetniSet", {
				filters: filters,
				urlParameters: null,
				sorters: null,
				async: true,
				success: function(oData) {
					this.getView().setModel(new JSONModel(oData.results), "mesajModel");
					page.setBusy(false);
				}.bind(this),
				error: function(oError) {
					var jsonError = JSON.parse(oError.responseText);
					sap.m.MessageBox.alert(jsonError.error.message.value);
					page.setBusy(false);
				}
			});
		},
		onSetVisibleColoum: function(vKDisi, vKIci) {

			var oView = this.getView();

			oView.byId("idFun").setVisible(vKDisi);
			oView.byId("idOdnckgun").setVisible(vKIci);

		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			//this._showObject(oEvent.getSource());
			var vIndex = oEvent.getSource().getBindingContext("detayModel").getPath().split("/")[1];
			var detayModelDetay = [this.getView().getModel("detayModel").getData()[vIndex]];
			var oJSONModel = new JSONModel();
			oJSONModel.setData(detayModelDetay);
			sap.ui.getCore().setModel(oJSONModel, "detayModel");
			this._showObject(this.getView().getModel("detayModel").getData()[vIndex]);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("Kapsam", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			/*			this.getRouter().navTo("object", {
							objectId: oItem.getBindingContext().getProperty("Pernr")
						});*/
			this.getRouter().navTo("object", {
				objectId: oItem.Pernr,
				kapsam: this._vKapsam
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("rows").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});