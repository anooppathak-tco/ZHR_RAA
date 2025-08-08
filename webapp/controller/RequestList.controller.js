sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/MessageToast",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	"sap/ui/model/FilterType"
], function(Controller, JSONModel, Filter, Fragment, MessageBox, BusyDialog, MessageToast, FilterOperator, Sorter,FilterType) {
	"use strict";

	return Controller.extend("ZHR_RaA.controller.RequestList", {


		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oBusy = new BusyDialog();
			this.oBusy.setBusyIndicatorDelay(0);
			/*var oUrlService = sap.ushell.Container.getService("URLParsing"),
				oHash = oUrlService.parseShellHash(window.location.hash);
			if (oHash.action === "create") {
				this.getEmployeeDetails();
			}*/
			this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oneMonthBefore = new Date(),
				today = new Date(),
				oDateModel = new JSONModel();
				oneMonthBefore.setMonth(today.getMonth()-1);
			oDateModel.setData({
				start:null,//oneMonthBefore,
				end: null});//today});
				var oView = this.getView();
			oView.setModel(oDateModel,"oDateModel");
			var that = this;
			this.getView().byId("exportTable").attachEventOnce("updateFinished", function() {
			that.onUpdateFinished();
		}, this);
			/*
		var reqModel = new sap.ui.model.odata.v2.ODataModel(this.getOwnerComponent().getModel().sServiceUrl);
			var enames = [];
			var enamArr = [];*/
			var enamMdl = new JSONModel();
			enamMdl.setData({});
			
			oView.setModel(enamMdl,"enamMdl");
			/*reqModel.read("/RequestListSet",{
				success: function(oData){
					var resultData = oData.results;
					for(var i = 0; i < resultData.length; i++)
					{
						 if(resultData[i].Ename.length && enames.indexOf(resultData[i].Ename) === -1) {
    						enames.push(resultData[i].Ename);
    						var object = {};
							object.Names = resultData[i].Ename;
							enamArr.push(object);
						 }
					}
				//	oView.getModel("enamMdl").setProperty("/Employees", enamArr);
				},
				error: function(){}
			});*/

		},
	/*	onAfterRendering: function() {
			debugger;
			var oView = this.getView();
			var fromDate = oView.getModel("oDateModel").getData().start;
			var toDate = oView.getModel("oDateModel").getData().end;
			var dateFilter = new sap.ui.model.Filter("Erdat", FilterOperator.BT,
				fromDate,toDate);

			oView.byId("exportTable").getBinding("items").filter(dateFilter, FilterType.Application);
		
		},
		onUpdateStarted: function(oEvt){
			debugger;
		},*/
		onUpdateFinished: function(){
				
			var enames = [],
				enamArr = [],
				awards = [],
				awardArr = [],
				statuses = [],
				statusArr = [];
			var oView = this.getView();	
			var item = oView.byId("exportTable").getBinding("items");
			var oModel = item.getModel();
			var allKeys = item.aKeys;
			for(var i = 0;i<allKeys.length;i++)
			{
				var keyPath = "/" + allKeys[i];
				var result = oModel.getObject(keyPath);
				if(result.Ename && enames.indexOf(result.Ename) === -1) {
    						enames.push(result.Ename);
    						var object = {};
							object.Names = result.Ename;
							enamArr.push(object);
						 }
				if(result.Awtext && awards.indexOf(result.Awtext) === -1) {
    						awards.push(result.Awtext);
    						object = {};
							object.Awtext = result.Awtext;
							awardArr.push(object);
						 }
				if(result.Status && statuses.indexOf(result.Status) === -1) {
    						statuses.push(result.Status);
    						object = {};
							object.Status = result.Status;
							statusArr.push(object);
						 }		 
			}
			oView.getModel("enamMdl").setProperty("/Employees", enamArr);
			oView.getModel("enamMdl").setProperty("/Awards", awardArr);
			oView.getModel("enamMdl").setProperty("/Statuses", statusArr);
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZHR_RaA.view.view.RequestList
		 */
		//	onInit: function() {
		//
		//	},
		onCreatePress: function(){
			this.oRouter.navTo("newreq", {
				layout: "MidColumnFullScreen",
				request: "0"
			});
		},
		onSearch : function () {
			var aFilters = [];
			var oView = this.getView();
			var fromDate = oView.getModel("oDateModel").getData().start;
			var toDate = oView.getModel("oDateModel").getData().end;
			if(fromDate&&toDate)
			{
				var dateFilter = new sap.ui.model.Filter("Erdat", FilterOperator.BT,
					fromDate,toDate);
					aFilters.push(dateFilter);
			}	

		
			var	sValue = oView.byId("oComboBox").getValue();
			if(sValue.length)
			{
				var	oFilter = new Filter("Ename", FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
			}	
			
			sValue = oView.byId("searchAward").getValue();
			if(sValue.length)
			{
				oFilter = new Filter("Awtext", FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
			}	
			
			sValue = oView.byId("searchStatus").getValue();
			if(sValue.length)
			{
				oFilter = new Filter("Status", FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
			}
			
			var InputFilter = new sap.ui.model.Filter({filters: aFilters , and: true});

			oView.byId("exportTable").getBinding("items").filter(InputFilter, FilterType.Application);
		} ,
		showRequest: function (oEvent) {
			
			var oItem = oEvent.getSource();
			var oBindingContext = oItem.getBindingContext();
			this.oRouter.navTo("reqDetail", {
				id: oBindingContext.getObject().Idrna
			});	
		},
		onRefresh: function(oEvent){
			var controls = oEvent.getSource().getParent().getContent();
			controls[3].setValue(null);
			controls[2].setValue(null);
			controls[1].setValue(null);
			this.getView().byId("exportTable").getModel().refresh();
			sap.m.MessageToast.show(this.oResourceBundle.getText("dataisRefreshed"));
		}
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZHR_RaA.view.view.RequestList
		 */
	

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZHR_RaA.view.view.RequestList
		 */
	

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZHR_RaA.view.view.RequestList
		 */
		//	onExit: function() {
		//
		//	}

	});

});