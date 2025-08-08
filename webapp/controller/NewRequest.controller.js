sap.ui.define([
	"ZHR_RaA/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, Filter, Fragment, MessageBox, BusyDialog, MessageToast) {
	"use strict";
	
	return BaseController.extend("ZHR_RaA.controller.NewRequest", {
		
		formatterSpacesAndKZT: function(nValue) {
			var sFormattedValue = nValue + "";
			sFormattedValue = sFormattedValue.replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ');
			sFormattedValue = sFormattedValue + " KZT";
			return sFormattedValue;	
		},
		
		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			
			var oVisModel = new JSONModel({
				hasCostCenterData : false,
				hasDepartmentData : false
			});
			this.getView().setModel(oVisModel, "visModel");

			var oModel = new JSONModel();
			this.oBusy = new BusyDialog();
			this.oBusy.setBusyIndicatorDelay(0);
			this.getView().setModel(oModel, "mModel");
			this.getModel("mModel").setData({
				empty: [],
				form: {
					InitPernr: "",
					InitFio: "",
					InitComment: "",
					InitMail: "",
					totalAmount: 0,
					typeAward: "",
					inf: [{}]
				}
			});
			var oUrlService = sap.ushell.Container.getService("URLParsing"),
				oHash = oUrlService.parseShellHash(window.location.hash);
			if (oHash.action === "create") {
				this.getEmployeeDetails();
			}
			this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this._checkVisModel();
		},
		_checkVisModel: function(){
			var that = this;
			this.getOwnerComponent().getModel().read("/CostCenterSet", {
								urlParameters: {
									$top: "1"
								},
								success: function(oData) {
									console.log("Result ", oData.results);
									var bHasData = oData.results && oData.results.length > 0;
									that.getModel("visModel").setProperty("/hasCostCenterData", bHasData);
									
								}
							});
			this.getOwnerComponent().getModel().read("/DepartmentSet", {
								urlParameters: {
									$top: "1"
								},
								success: function(oData) {
									console.log("Result ", oData.results);
									var bHasData = oData.results && oData.results.length > 0;
									that.getModel("visModel").setProperty("/hasDepartmentData", bHasData);
									
								}
							});
		},
		inpAmountLiveChange: function(oE) {
			debugger;
			var oInput = oE.getSource(),
				nValue = +oE.getParameter("value"),
				nMinValue = +oInput.data("sMinValue"),
				nMaxValue = +oInput.data("sMaxValue"),
				oAwardCurrency = this.byId("inpAmountCurrency"),
				nConst = +this.getModel("mModel").getProperty("/MciSet/Betrg"),
				oBtnSubmit = this.byId("idAwardTypeBtnSbmt") || sap.ui.getCore().byId("idAwardTypeBtnSbmt");
			oAwardCurrency.setText(this.multiplyAndSpaces(nValue, nConst) + " KZT");
			oInput.setValueState("None");
			oBtnSubmit.setEnabled(true);
			if (nValue < nMinValue) {
				oInput.setValueState("Error");
				oInput.setValueStateText(this.oResourceBundle.getText("low"));
				oBtnSubmit.setEnabled(false);
			}
			if (nValue > nMaxValue) {
				oInput.setValueState("Error");
				oInput.setValueStateText(this.oResourceBundle.getText("high"));
				oBtnSubmit.setEnabled(false);
			}
		},
		
		setAmountValue: function(sAwType, sLevType, sDefValue, sPath, sLevText, sMinValue, sMaxValue, sOpenCert) {
			var oAwardInp = this.byId("inpAmount"),
				oAwardCurrency = this.byId("inpAmountCurrency"),
				nConst = +this.getModel("mModel").getProperty("/MciSet").Betrg.split(".")[0];
			oAwardInp.setValue(sDefValue);
			if (!!sDefValue) {
				oAwardCurrency.setText(this.multiplyAndSpaces(+sDefValue, nConst) + " KZT");
			}
			oAwardInp.data("sMinValue", sMinValue);
			oAwardInp.data("sMaxValue", sMaxValue);
			this.getModel("mModel").setProperty(sPath + "/AwType", sAwType);
			this.getModel("mModel").setProperty(sPath + "/LevType", sLevType);
			this.getModel("mModel").setProperty(sPath + "/LevText", sLevText);
			
			var msgStrip = this.byId("awardTypeDialog").getAggregation("content")[0].getItems()[0].getAggregation("content")[2].getItems()[0];
			if(sAwType === "NC"){
				debugger;
				//var levelRes = radioBtnGrp.getSelectedButton().getBindingContext("mModel").getObject();
				if(sOpenCert=== "000000"){
					var loggedUserName = sap.ushell.Container.getUser().getFullName();
					var noCertModifiedText = this.oResourceBundle.getText("noCertificate",[loggedUserName,sDefValue]);
					msgStrip.setText(noCertModifiedText);
				msgStrip.setVisible(true);
				}
				else{
				msgStrip.setVisible(false);
				}
			}
			else{
				msgStrip.setVisible(false);
				
			}
		},
		
		amountTextFormatter: function(sTypeAward, sLevText, sLevAmt) {
			if (!!sTypeAward && !!sLevText && !!sLevAmt) {
				switch (sTypeAward) {
					case "":
						return "";
					case "C":
						return sLevText + " " + sLevAmt + " " + this.oResourceBundle.getText("mci");
					case "N":
						return  sLevText;
				}
			}
		},

		awardTypeTextFormatter: function(sAwardType, sLevText, sMinValue, sMaxValue) {
			if (!!sAwardType && !!sLevText && !!sMinValue && !!sMaxValue) {
				if (sAwardType === "C") {
					return sMaxValue === "999" ? sLevText + " " + sMinValue + " " + this.oResourceBundle.getText("mci") : sLevText + " " + sMinValue + " - " + sMaxValue + " " + this.oResourceBundle.getText("mci");
				} else {
					return sLevText;
				}
			}
		},
		
		onAwardSelect: function(oE) {
			var sPath = this.byId("awardTypeDialog").data("path"),
				oAward = oE.getSource().getBindingContext("mModel").getObject(),
				aContent = oE.getSource().getParent().getParent().getAggregation("content"),
				oAwardInput = this.byId("inpAmount"),
				bCashAward = this.getModel("mModel").getProperty("/form/typeAward") === "C",
				aAwardSet = this.getModel("mModel").getProperty("/AwardSet");
			if (!oAwardInput.getEnabled() && bCashAward) {
				oAwardInput.setEnabled(true);
			}
			if (oE.getParameter("selected")) {
				if (oAward.LevelSet) {
                    oAward.LevLongText = oAward.LevelSet.results[0].LevLongText;
					var oRadioButtonGroup = aContent[1].getItems()[0];
					oRadioButtonGroup.setEnabled(true);
					this.setAmountValue(oAward.LevelSet.results[0].AwType, oAward.LevelSet.results[0].LevType, oAward.LevelSet.results[0].DefValue, 
						sPath, oAward.LevelSet.results[0].LevText, oAward.LevelSet.results[0].MinValue, oAward.LevelSet.results[0].MaxValue,oAward.LevelSet.results[0].Opencert);
				} else {
					aAwardSet.forEach(function (item) {
						if (item.AwType === oAward.AwType) {
							item.LevLongText = oAward.LevLongText;
						}
					});
					this.setAmountValue(oAward.AwType, oAward.LevType, oAward.DefValue, 
						sPath, oAward.LevText, oAward.MinValue, oAward.MaxValue,oAward.Opencert);
				}
			} else {
				if (oAward.LevelSet) {
					oRadioButtonGroup = aContent[1].getItems()[0];
					oAward.LevLongText = "";
					oRadioButtonGroup.setSelectedIndex(0);
					oRadioButtonGroup.setEnabled(false);
					this.setAmountValue("", "", "", sPath, "", "", "","");
				}
			}
/*			var msgStrip = this.byId("awardTypeDialog").getAggregation("content")[0].getItems()[0].getAggregation("content")[1].getItems()[0].getItems()[1];
			var radioBtnGrp = this.byId("awardTypeDialog").getAggregation("content")[0].getItems()[0].getAggregation("content")[1].getItems()[0].getItems()[0];
			if(bCashAward === false){
				debugger;
				var levelRes = radioBtnGrp.getSelectedButton().getBindingContext("mModel").getObject();
				if(levelRes.Opencert === "000000"){
				msgStrip.setVisible(true);
				}
				else{
				msgStrip.setVisible(false);
				}
			}
			else{
				msgStrip.setVisible(false);
				
			}*/
			this.getModel("mModel").refresh();
			
		},
		
		handleAddInfo: function() {
			var aInf = this.getModel("mModel").getProperty("/form/inf");
			aInf.push({});
			this.getModel("mModel").refresh();
		},
		
		handleDelInfo: function(oE) {
			var aInf = this.getModel("mModel").getProperty("/form/inf"),
				nPath = +oE.getSource().getParent().getItems()[0].getBindingContext("mModel").getPath().split("/")[3];
			if (aInf.length > 1) {
				aInf.splice(nPath, 1);
				this.getModel("mModel").refresh();
			} else {
				aInf.push({});
				aInf.splice(0,1);
				this.getModel("mModel").refresh();
			}
			this.totalAmountRecalculate(aInf);
		},
		
		totalAmountRecalculate: function(aInf) {
			var nTotalAmount = 0;
			aInf.forEach(function(item) {
				if (item.kztAmount) {
					nTotalAmount = nTotalAmount + item.kztAmount;
				}
			});	
			this.getModel("mModel").setProperty("/form/totalAmount", nTotalAmount);
		},
		
		onPressAwardType: function(oE) {
			var oView = this.getView(),
				sPath = oE.getSource().getBindingContext("mModel").getPath();
			if (!this._awardValueHelpDialog) {
				this._awardValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.AwardType",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					return oValueHelpDialog;
				}.bind(this));
			}
			this._awardValueHelpDialog.then(function(oValueHelpDialog) {
				oValueHelpDialog.open();
				oValueHelpDialog.data("path", sPath);
			}.bind(this));
		},
		
		onAwardTypeHelpClose: function() {
			this.getModel("mModel").getProperty("/AwardSet").forEach(function (item) {
				item.LevLongText = "";
			});
			this._awardValueHelpDialog.then(function (oDialog) {
				oDialog.close();
				oDialog.destroy();
				this._awardValueHelpDialog = null;
			}.bind(this));
		},
		
		onAwardTypeHelpSubmit: function() {
			this.getModel("mModel").getProperty("/AwardSet").forEach(function (item) {
				item.LevLongText = "";
			});
			this._awardValueHelpDialog.then(function (oDialog) {
				var sPath = oDialog.data("path"),
					sReason = this.byId("inpIndividualReason").getValue(),
					sValue = this.byId("inpAmount").getValue(),
					bCashAward = this.getModel("mModel").getProperty("/form/typeAward") === "C",
					nConst = bCashAward ? +this.getModel("mModel").getProperty("/MciSet/Betrg") : 1,
					aInf = this.getModel("mModel").getProperty("/form/inf");
				this.getModel("mModel").setProperty(sPath + "/LvAmt", sValue);
				this.getModel("mModel").setProperty(sPath + "/InitComment", sReason);
				this.getModel("mModel").setProperty(sPath + "/kztAmount", +sValue * nConst);
				this.totalAmountRecalculate(aInf);
				oDialog.close();
				oDialog.destroy();
				this._awardValueHelpDialog = null;
			}.bind(this));
		},
		
		onPressEmployee: function(oE) {
			debugger;
			var oView = this.getView(),
				sPath = oE.getSource().getBindingContext("mModel").getPath();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.Employee",
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
				var oTable = this.byId("employeeTable"),
					oTemplate = oTable.getBindingInfo("items").template.clone();
				oTable.data("path", sPath);
				oTable.bindItems({
					path: "/EmployeesSet",
					template: oTemplate
				});
			}.bind(this));
		},
		
		onEmployeeSearch: function(oE) {
			var sKey = oE.getSource().data("key"),
				oTable = this.byId("employeeTable"),
				sValue = oE.getSource().getValue(),
				sOperator = oE.getSource().data("operator");
			oTable.getBinding("items").filter(new Filter(sKey, sOperator, sValue));
		},
		
		handleEmployeeSelect: function(oE) {
			var oObj = oE.getSource().getBindingContext().getObject(),
				sPernr = oObj.Pernr,
				sEname = oObj.Ename,
				sPersg = oObj.Persg,
				sTypeAward = this.getModel("mModel").getProperty("/form/typeAward"),
				oTable = this.byId("employeeTable"),
				aInf = this.getModel("mModel").getProperty("/form/inf"),
				sPath = oTable.data("path"),
				user = aInf.find(function (item) {
					return item.Pernr === sPernr;	
				});
			if (sPersg === "3" && sTypeAward !== "N") {
				MessageBox.error(this.oResourceBundle.getText("errorTextTypeAward", [sEname, sPernr]));
				return;
			}
			if (user) {
				MessageBox.error(this.oResourceBundle.getText("errorText"));
				return;
			}
			this.getModel("mModel").setProperty("/form/inf/" + sPath + "/", oObj);
			this.onEmployeeHelpClose();
		},
		
		onEmployeeHelpClose: function() {
			this._pValueHelpDialog.then(function (oDialog) {			
				oDialog.close();
				oDialog.destroy();
				this._pValueHelpDialog = null;
			}.bind(this));
		},


		onPressCostCenter: function(oE) {
			var oView = this.getView();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.CostCenter",
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
				var oTable = this.byId("costCenterTable"),
					oTemplate = oTable.getBindingInfo("items").template.clone();
				oTable.bindItems({
					path: "/CostCenterSet",
					parameters:{
						operationMode: "Client"
					},
					template: oTemplate
				});
			}.bind(this));
		},
		
		onCostCenterSearch: function(oE) {
			var sKey = oE.getSource().data("key"),
				oTable = this.byId("costCenterTable"),
				sValue = oE.getSource().getValue(),
				sOperator = oE.getSource().data("operator");
			oTable.getBinding("items").filter(new Filter(sKey, sOperator, sValue));
		},
		
		handleCostCenterSelect: function(oE) {
			var oObj = oE.getSource().getBindingContext().getObject(),
				sCostCenter = oObj.Id,
				sEname = oObj.Name;
			this.getModel("mModel").setProperty("/form/IdCostCenter", sCostCenter);
			this.getModel("mModel").setProperty("/form/NameCostcenter", sEname);
			this.onCostCenterHelpClose();
		},
		
		onCostCenterHelpClose: function() {
			this._pValueHelpDialog.then(function (oDialog) {			
				oDialog.close();
				oDialog.destroy();
				this._pValueHelpDialog = null;
			}.bind(this));
		},
		onPressDepartment: function(oE) {
			var oView = this.getView();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.Department",
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
				var oTable = this.byId("departmentTable"),
					oTemplate = oTable.getBindingInfo("items").template.clone();
				oTable.bindItems({
					path: "/DepartmentSet",
					parameters:{
						operationMode: "Client"
					},
					template: oTemplate
				});
			}.bind(this));
		},
		
		onDepartmentSearch: function(oE) {
			var sKey = oE.getSource().data("key"),
				oTable = this.byId("departmentTable"),
				sValue = oE.getSource().getValue(),
				sOperator = oE.getSource().data("operator");
			oTable.getBinding("items").filter(new Filter(sKey, sOperator, sValue));
		},
		
		handleDepartmentSelect: function(oE) {
			var oObj = oE.getSource().getBindingContext().getObject(),
				sDepartment = oObj.Id,
				sDepartmentName = oObj.Name;
			this.getModel("mModel").setProperty("/form/IdDepartment", sDepartment);
			this.getModel("mModel").setProperty("/form/NameDepartment", sDepartmentName);
			this.onDepartmentHelpClose();
		},
		
		onDepartmentHelpClose: function() {
			this._pValueHelpDialog.then(function (oDialog) {			
				oDialog.close();
				oDialog.destroy();
				this._pValueHelpDialog = null;
			}.bind(this));
		},
		
		onSubmit: function() {
			var aInf = this.getModel("mModel").getProperty("/form/inf"),
				aInfCopy = JSON.parse(JSON.stringify(aInf)),
				sGeneralReason = this.getModel("mModel").getProperty("/form/InitComment"),
				oSelectGenManager = this.byId("selectGenManager"),
				sAwardType = this.getModel("mModel").getProperty("/form/typeAward");
			if (!oSelectGenManager.getSelectedItem() && sAwardType === "C") {
				oSelectGenManager.setValueState("Error");
				oSelectGenManager.setValueStateText(this.oResourceBundle.getText("chooseGenManager"));
			}
			aInfCopy.forEach(function (item) {
				if (item.InitComment === "") {
					item.InitComment = sGeneralReason;
				}
				delete item.__metadata;
				delete item.Ename;
				delete item.KostlText;
				delete item.LevText;
				delete item.LsEname;
				delete item.kztAmount;
				delete item.Persg;
			});
			var aInfSend = aInfCopy.filter(function (item) {
				return !!item.Pernr;	
			});
			var oObj = this.getModel("mModel").getProperty("/form"),
				sGmPernr = sAwardType === "C" ? this.byId("selectGenManager").getSelectedKey() : this.getModel("mModel").getProperty("/ApproverSet/0/GmPernr"),
				sGdPernr = this.getModel("mModel").getProperty("/GenDirSet/0/GdPernr"),
				sInitLsper = this.getModel("mModel").getProperty("/InitLsSet/0/InitLsper"),
				sInitLsperFio = this.getModel("mModel").getProperty("/InitLsSet/0/InitLsperFio"),
				data = {
					InitLsper: sInitLsper,
					InitLsperFio: sInitLsperFio,
					GdPernr: sGdPernr,
					GmPernr: sGmPernr,
					InitPernr: oObj.InitPernr,
					InitComment: oObj.InitComment,
					InitKostl: oObj.IdCostCenter,
					InitOrgeh: oObj.IdDepartment,
					RnaEmployeesSet: aInfSend
				};
			this.oBusy.open();
			this.getOwnerComponent().getModel().create("/RnaFormSet", data, {
				success: function(oData) {
					this.oBusy.close();
					MessageToast.show(this.oResourceBundle.getText("success"));
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNavigator.toExternal({
						target: {shellHash: "#Shell-home"}
					});
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
	                //sMessage = sMessage + "\n" + "\n" + this.oResourceBundle.getText("support");
	                MessageBox.error(sMessage);
				}.bind(this)
			});
		},
		
		handleApproverChange: function(oE) {
			var oSelect = oE.getSource(),
			    oObj = oSelect.getSelectedItem().getBindingContext("mModel").getObject(),
				sText = oObj.Stext,
				aSubstitute = oObj.SubstituteSet.results,
				oText = this.byId("approverTextId"),
				oButton = this.byId("idSubstituteButton");
			oText.setText(sText);
			oButton.setVisible(!!aSubstitute.length);
			oSelect.setValueState("None");
			oSelect.setValueStateText("");
		},
		
		onSubstituteShow: function(oE) {
			var oSelect = this.byId("selectGenManager"),
				oButton = oE.getSource(),
				oView = this.getView(),
				sPath = oSelect.getSelectedItem().getBindingContext("mModel").getPath();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "ZHR_RaA.fragment.SubstituteSetPopover",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopover.then(function(oPopover) {
				var oForm = this.byId("idSubstituteForm"),
					oTemplate = oForm.getBindingInfo("formContainers").template.clone();
				oForm.bindAggregation("formContainers", {
					path: sPath + "/SubstituteSet/results",
					model: "mModel",
					template: oTemplate
				});
				oPopover.openBy(oButton);
			}.bind(this));
		},
		
		onDiscard: function() {
			var sTypeAward = this.getModel("mModel").getProperty("/form/typeAward");
			this.getModel("mModel").setData({
				empty: [],
				form: {
					InitPernr: "",
					InitFio: "",
					InitComment: "",
					InitMail: "",
					totalAmount: 0,
					typeAward: sTypeAward,
					inf: [{}]
				}
			});
			this.getEmployeeDetails();
		},
		
		onRequestPress: function(){
			this.oRouter.navTo("new", {
				layout: "MidColumnFullScreen",
				request: "0"
			});
		},
		
		onPressHistory: function(oE) {
			var oView = this.getView(),
				sPath = oE.getSource().getBindingContext("mModel").getPath();
			var pernr = this.getModel("mModel").getObject(sPath).Pernr;	
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
		formatterPayDate: function (sDate) {
			var year = sDate.substr(0,4);
			if(year === "0000"){
			return "";	
			}
			if (sDate) {
				return sDate.split("-")[2] + "." + sDate.split("-")[1] + "." + sDate.split("-")[0];
			}
		}
		
	});
});