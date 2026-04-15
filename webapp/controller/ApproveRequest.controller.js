sap.ui.define([
	"ZHR_RaA/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/m/BusyDialog",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/TextArea",
	"sap/m/Label",
	"sap/m/MessageBox",
	"sap/base/util/deepClone"
], function(BaseController, JSONModel, Filter, Fragment, BusyDialog, Dialog, DialogType, Button, ButtonType, MessageToast, Text, TextArea, Label, MessageBox, deepClone) {
	"use strict";

	return BaseController.extend("ZHR_RaA.controller.ApproveRequest", {
		
		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("approve").attachMatched(this._onRouteMatched, this);
			this.mSrv = this.getOwnerComponent().getModel();
			this.oBusy = new BusyDialog();
			this.oBusy.setBusyIndicatorDelay(0);
			this.getView().setModel(new JSONModel(), "mMdl");
			this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		
		sumAward: function() {
			this.oBusy.open();
			this.mSrv.read("/MciSet(Molga='KZ',Konst='ZMRP3',Endda='99991231')", {
					success: function(mci) {
					console.log("MciSet ", mci);
					mci.Betrg = mci.Betrg.split(".")[0];
					this.getModel("mMdl").setProperty("/MciSet", mci);
					
					var sum = 0;
					var aData = this.getModel("mMdl").getProperty("/RnaEmployeesSet");
					var constBetrg = +(this.getModel("mMdl").getProperty("/MciSet/Betrg"));
			
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
					this.byId("test").setText(this.oResourceBundle.getText("total") + " " + sText);

					this.oBusy.close();
				}.bind(this)
			});	
		},
		
		_onRouteMatched: function(oE) {
			var sIdRna = oE.getParameter("arguments").id;
			this.oBusy.open();
			this.mSrv.read("/RnaFormSet('" + sIdRna + "')", {
				urlParameters: {
					"$expand": "RnaEmployeesSet,RnaEmployeesSet/Attachments"	
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
					this.getModel("mMdl").setData(oNewData);
					this.getModel("mMdl").setProperty("/oldData", oOldData);
					
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
	                MessageBox.error(sMessage);
				}.bind(this)
			});
		},
		
        handleFilePress: function(oEvt){
			debugger;
			var basePath = oEvt.getSource().getModel().sServiceUrl;
            var oObj = oEvt.getSource().getBindingContext("mMdl").getObject();
            var sEntityKey = "Id='" + encodeURIComponent(oObj.Id) +  "'";
            var sPath = window.location.origin + basePath + "/AttachmentSet(" + sEntityKey + ")/$value";
            sap.m.URLHelper.redirect(sPath,true);
        },
		onSubmitDialogPress: function (oObj) {
			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					type: DialogType.Message,
					title: this.oResourceBundle.getText("reasonForReject"),
					content: [
						new Label({
							text: this.oResourceBundle.getText("reasonForRejText"),
							labelFor: "submissionNote"
						}),
						new TextArea("submissionNote", {
							width: "100%",
							placeholder: this.oResourceBundle.getText("addNote"),
							liveChange: function (oEvent) {
								var sText = oEvent.getParameter("value");
								this.oSubmitDialog.getBeginButton().setEnabled(sText.length > 0);
							}.bind(this)
						})
					],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: this.oResourceBundle.getText("submit"),
						enabled: false,
						press: function () {
							var sText = sap.ui.getCore().byId("submissionNote").getValue();
							if (typeof(oObj) === "object") {
								oObj.BossComment = sText;
							} else {
								this.getModel("mMdl").getProperty("/RnaEmployeesSet").forEach(function(item) {
									item.BossComment = sText;
								});
							}
							this.getModel("mMdl").refresh();
							this.oSubmitDialog.destroy();
			                this.oSubmitDialog = null;
						}.bind(this)
					})
				});
			}

			this.oSubmitDialog.open();
			this.oSubmitDialog.setEscapeHandler(function (oPromise) {
				oPromise.reject();
	        });
		},
		handleSelectAll: function(oE) {
			var sDecision = oE.getSource().data("decision"),
				aRnaEmployeesSet = this.getModel("mMdl").getProperty("/RnaEmployeesSet");
			aRnaEmployeesSet.forEach(function(item) {
				item.Action = sDecision;
				item.BossComment = "";
			});
			if (sDecision === "02") {
				this.onSubmitDialogPress(sDecision);
			}
			this.getModel("mMdl").refresh();
			this.sumAward();
		},
		
		approveRejectAllVisibleFormatter: function(aRnaEmployeesSet) {
			if (aRnaEmployeesSet) {
				return aRnaEmployeesSet.length > 1;
			}
		},
		
		onRadioButtonSelect: function(oE) {
			var oBtn = oE.getSource(),
				sDecision = oBtn.data("decision"),
				oObj = oBtn.getBindingContext("mMdl").getObject();
				//sClass = sDecision === "02" ? "rejectRadio" : "approveRadio";
			if (oE.getParameter("selected")) {
				if (sDecision === "02") {
					this.onSubmitDialogPress(oObj);
				} else {
					oObj.BossComment = "";
				}
				oObj.Action = sDecision;
				this.getModel("mMdl").refresh();
				this.sumAward();
				//oBtn.removeStyleClass(sClass);
			} else {
				//oBtn.addStyleClass(sClass);
			}
		},
		
		awardTypeTextFormatter: function (sAwardType, sLvAmt, sLevText, sBetrg) {
			if (!!sAwardType && !!sLvAmt && !!sLevText && !!sBetrg) {
				var dResult = +sLvAmt * +sBetrg;
				var sResult = dResult + "";
				var sResultWithSpaces = sResult.replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ');
				return sAwardType === "NC" ? sLevText : sLvAmt + " " + this.oResourceBundle.getText("mci") + " (" + sResultWithSpaces + " KZT)";
			}
		},
		
		onSubmit: function(oE) {
			var data = this.getModel("mMdl").getData(),
				oldData = data.oldData;
			data.RnaEmployeesSet.forEach(function(item, i) {
				if (item.BossComment !== oldData.RnaEmployeesSet.results[i].BossComment) {
					item.IsUpdated = true;	
				} else {
					item.IsUpdated = false;
				}
			});
			var oDataClone = deepClone(data);
			delete oDataClone.oldData;
			delete oDataClone.MciSet;
			this.oBusy.open();
			this.mSrv.create("/RnaFormSet", oDataClone, {
				success: function(oResponse) {
					this.oBusy.close();
					MessageBox.show(this.oResourceBundle.getText("success"));
					window.close();
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
	                MessageBox.error(sMessage);
				}.bind(this)
			});
		},
	onPressHistory: function(oE) {
			var oView = this.getView(),
				sPath = oE.getSource().getBindingContext("mMdl").getPath();
			var pernr = this.getModel("mMdl").getObject(sPath).Pernr;	
			var aFilters = new sap.ui.model.Filter("Pernr", "EQ", pernr);	
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.History",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oValueHelpDialog.setEscapeHandler(this.onEmployeeHelpClose);
					return oValueHelpDialog;
				}.bind(this));
			}
		
			this._pValueHelpDialog.then(function(oValueHelpDialog) {
				oValueHelpDialog.open();
				var oTable = this.byId("historyTable"),
					oTemplate = oTable.getBindingInfo("items").template.clone();
				oTable.data("path", sPath);
				oTable.bindItems({
					path: "/NomineeLastRequestSet",
					template: oTemplate,
					filters: aFilters
				});
			}.bind(this));
				
		},
				onEmployeeHelpClose: function() {
			this._pValueHelpDialog.then(function (oDialog) {			
				oDialog.close();
				oDialog.destroy();
				this._pValueHelpDialog = null;
			}.bind(this));
		}
		
	});
});