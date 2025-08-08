sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/BusyDialog",
	"sap/ui/model/json/JSONModel"
], function(Controller,BusyDialog,JSONModel) {
	"use strict";

	return Controller.extend("ZHR_RaA.controller.requestDetail", {


		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("reqDetail").attachMatched(this._onRouteMatched, this);
			this.mSrv = this.getOwnerComponent().getModel();
			this.oBusy = new BusyDialog();
			this.oBusy.setBusyIndicatorDelay(0);
			this.getView().setModel(new JSONModel(), "mMdl");
			this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		sumAward: function() {
			/*this.oBusy.open();
			this.mSrv.read("/MciSet(Molga='KZ',Konst='ZMRP3',Endda='99991231')", {
					success: function(mci) {
					mci.Betrg = mci.Betrg.split(".")[0];
					this.getView().getModel("mMdl").setProperty("/MciSet", mci);
					
					var sum = 0;
					var aData = this.getView().getModel("mMdl").getProperty("/RnaEmployeesSet");
					var constBetrg = +(this.getView().getModel("mMdl").getProperty("/MciSet/Betrg"));
			
					aData.forEach(function(item) {
						if (item.Action === "01") {
							sum = sum + +(item.LvAmt);		
						}
					});
					
					var dResult = sum * constBetrg;
					var sResult = dResult + "";
					var sResultWithSpaces = sResult.replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ');
					var sTextMCI = sum + " " + this.oResourceBundle.getText("mci");
					var sTextKZT = "(" + sResultWithSpaces + " KZT)";
					var sAwardType = this.getView().getModel("mMdl").getProperty("/RnaEmployeesSet/0/AwType");
					var sText;
					if (sAwardType === "NC") {
						sText = String(sum).replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ') + " " + "KZT";
					} else {
						sText = sTextMCI + " " + sTextKZT;
					}
				this.getView().byId("test").setText(this.oResourceBundle.getText("total") + " " + sText);

					this.oBusy.close();
				}.bind(this)
			});	*/
		},

		_onRouteMatched: function(oE) {
			var sIdRna = oE.getParameter("arguments").id;
			this.oBusy.open();
			this.mSrv.read("/RnaFormSet('" + sIdRna + "')", {
				urlParameters: {
					"$expand": "RnaEmployeesSet",
					"MyRequest": "X"
				},
				success: function(oData) {
					var	oOldData = JSON.parse(JSON.stringify(oData));
					oData.RnaEmployeesSet.results.forEach(function(item) {
						delete item.__metadata;
						item.Action = "01";
					});
					var oNewData = Object.assign({}, oData);
					delete oNewData.__metadata;
					oNewData.RnaEmployeesSet = oData.RnaEmployeesSet.results;
					this.getView().getModel("mMdl").setData(oNewData);
					this.getView().getModel("mMdl").setProperty("/oldData", oOldData);
					
					this.sumAward();
					
					this.oBusy.close();
				}.bind(this),
				error: function(error) {
					this.oBusy.close();
					var sMessage = "";
					if (error.responseText) {
	                    var oError = JSON.parse(error.responseText);
	                }
	                if (oError && oError.error && oError.error.message && oError.error.message.value) {	
						sMessage = oError.error.message.value;
	                }
	                if (oError && oError.error && oError.error.innererror && oError.error.innererror.errordetails && oError.error.innererror.errordetails.length) {
	                	sMessage = "";
	                	oError.error.innererror.errordetails.forEach(function(item) {
	                		sMessage = sMessage + item.message + "\n" + "\n";
	                	});
	                }
	                sap.m.MessageBox.error(sMessage);
				}.bind(this)
			});
			
			this.mSrv.read("/ReqActorsSet", {
				filters: [
					new sap.ui.model.Filter("IdRna","EQ", sIdRna)
				],
				success: function(oData) {
					this.getView().getModel("mMdl").setProperty("/reqActors", oData.results);
				}.bind(this)
			});
			
			this.mSrv.read("/REQHISTORYSet", {
				filters: [
					new sap.ui.model.Filter("IdRna","EQ", sIdRna)
				],
				success: function(oData) {
					this.getView().getModel("mMdl").setProperty("/reqHistory", oData.results);
				}.bind(this)
			});
		},
		
		awardTypeTextFormatter: function (sAwardType, sLvAmt, sLevText) {
			if (!!sAwardType && !!sLvAmt && !!sLevText) {
				return sAwardType === "NC" ? sLevText : sLvAmt + " " + this.oResourceBundle.getText("mci");
			}
		},
		onCloseDetailPress: function () {
			// this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			this.oRouter.navTo("new");
		}
		
	});
});