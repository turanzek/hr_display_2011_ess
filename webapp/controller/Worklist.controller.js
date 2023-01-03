/*global location history */
sap.ui.define([
	"tt/ZHR_TT_ESS_GIRIS_CIKIS/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"tt/ZHR_TT_ESS_GIRIS_CIKIS/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("tt.ZHR_TT_ESS_GIRIS_CIKIS.controller.Worklist", {

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

				var oJSONModel = new JSONModel();
				this.getView().setModel(oJSONModel, "detayModel");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];


			this.setModel(oViewModel, "worklistView");



			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});


			var vBegda = new Date(); //gün tarihinden 1 gün geri gidiliyor
			vBegda = Math.abs(vBegda.getTime() - 1000 * 60 * 60 * 24 * 1);

			var oModel = new JSONModel();
			oModel.setData({
				delimiter: "-",
				dateValue: new Date(vBegda),
				secondDateValue: new Date(),
				dateFormat: "dd.MM.yyyy"
			});
			this.getView().setModel(oModel, "talepFilterModel");

	
		},

		onBeforeRendering: function(oEvent) {
			
			this.startSearch();

		},

		onChangeFilter:function (event) {


			this.startSearch();

		},
		startSearch:function(){
			var page = this.byId("page");

			var filters = [new Filter("Ldate", FilterOperator.BT,
				this.getView().byId("idTarih").getDateValue(),
				this.getView().byId("idTarih").getSecondDateValue())];

			page.setBusy(true);

			this.getView().getModel().read("/GirisCikisListSet", {
				filters: filters,
				urlParameters: null,
				sorters: null,
				async: true,
				success: function(oData) {
					if (oData.results.length > 0) {

						var detayModel = this.getView().getModel("detayModel");
						detayModel.setData(oData.results);

						

						var headerModel = this.getView().getModel("header");
						// headerModel.setProperty("/Kapsam", oData.results[0].Kapsam);
					}
					page.setBusy(false);

				}.bind(this),
				error: function(oError) {
					var jsonError = JSON.parse(oError.responseText);
					sap.m.MessageBox.alert(jsonError.error.message.value);
					page.setBusy(false);
				}
			});

		}

		
	

	});
});