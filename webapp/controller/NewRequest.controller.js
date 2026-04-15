sap.ui.define([
	"ZHR_RaA/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/ui/core/HTML"
], function(BaseController, JSONModel, Filter, Fragment, MessageBox, BusyDialog, MessageToast, Dialog, Button, HTML) {
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
// Get the current year
			var currentYear = new Date().getFullYear();
// Create min and max date objects
			var minDate = new Date(currentYear, 0, 1);    // January is 0
			var maxDate = new Date(currentYear, 11, 31);
			var oDateModelAward = new JSONModel({	
				minDate: minDate,
				maxDate: maxDate});
			this.getView().setModel(oDateModelAward, "dateModelAward");
			var oVisModel = new JSONModel({
				hasCostCenterData : false,
				hasDepartmentData : false
			});
			this.getView().setModel(oVisModel, "visModel");
			var oFileModel = new sap.ui.model.json.JSONModel({
					files: [] // Initialize with an empty array
				});
			this.getView().setModel(oFileModel, "fileModel");
			this.uplArray = {};
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
			var sPath = this.selPath;
			var oView = this.getView();
			var sFragmentId = oView.getId() + sPath.replace(/\//g, "_");
			var oInput = oE.getSource(),
				nValue = +oE.getParameter("value"),
				nMinValue = +oInput.data("sMinValue"),
				nMaxValue = +oInput.data("sMaxValue"),
				oAwardCurrency = Fragment.byId(sFragmentId,"inpAmountCurrency"),
				nConst = +this.getModel("mModel").getProperty("/MciSet/Betrg"),
				oBtnSubmit = Fragment.byId(sFragmentId, "idAwardTypeBtnSbmt") || sap.ui.getCore().byId("idAwardTypeBtnSbmt");
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
			var sFragmentId = this.getView().getId() + sPath.replace(/\//g, "_");
			var oAwardInp = Fragment.byId(sFragmentId,"inpAmount"),
				oAwardCurrency = Fragment.byId(sFragmentId,"inpAmountCurrency"),
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
			this._awardValueHelpDialogs[sPath].then(function(oValueHelpDialog) {
			var msgStrip = oValueHelpDialog.getAggregation("content")[0].getItems()[0].getAggregation("content")[2].getItems()[0];
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
				
			}}.bind(this));
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
			var sPath = this.selPath;
			var oView = this.getView();
			var sFragmentId = oView.getId() + sPath.replace(/\//g, "_");
			var	oAward = oE.getSource().getBindingContext("mModel").getObject(),
				aContent = oE.getSource().getParent().getParent().getAggregation("content"),
				oAwardInput = Fragment.byId(sFragmentId, "inpAmount"),
				bCashAward = this.getModel("mModel").getProperty("/form/typeAward") === "C",
				aAwardSet = this.getModel("mModel").getProperty("/AwardSet"),
				bShowJust = oAward.ShowJust !== undefined ? oAward.ShowJust : oAward.LevelSet.results[0].ShowJust,
				bShowAttach = oAward.ShowAttach !== undefined ? oAward.ShowAttach : oAward.LevelSet.results[0].ShowAttach;
    			this._setJustificationVisibility(sPath, bShowJust);
				this._setAttachmentVisibility(sPath, bShowAttach);
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
			this.getModel("mModel").refresh();
			
		},
		_setJustificationVisibility: function(sPath, bVisible) {
			var sFragmentId = this.getView().getId() + sPath.replace(/\//g, "_");
			Fragment.byId(sFragmentId, "idFormattedText").setVisible(bVisible);
			Fragment.byId(sFragmentId, "indResaon").setVisible(bVisible);
		},
		_setAttachmentVisibility: function(sPath, bVisible) {
			var sFragmentId = this.getView().getId() + sPath.replace(/\//g, "_");
			Fragment.byId(sFragmentId, "awardDateInp").setVisible(bVisible);
			Fragment.byId(sFragmentId, "uploadsetBox").setVisible(bVisible);
		},
		handleAddInfo: function() {
			var aInf = this.getModel("mModel").getProperty("/form/inf");
			aInf.push({});
			this.getModel("mModel").refresh();
		},		
		handleDelInfo: function(oE) {
			var aInf = this.getModel("mModel").getProperty("/form/inf"),
				sPernr = oE.getSource().getParent().getItems()[0].getBindingContext("mModel").getObject().Pernr,
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
			delete this.uplArray[sPernr];
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
		onInitAwardSelect: function(oE) {
			let mModel = this.getModel("mModel");
			let diagId = this.getView().getId() + "initAward";
			this.initSelObjPath = oE.getSource().getBindingContext("mModel").getPath();
			this.initSelObj = oE.getSource().getBindingContext("mModel").getObject();
			mModel.getProperty("/AwardSet").forEach(function (item) {
				item.LevLongText = "";
			});
			mModel.setProperty(this.initSelObjPath+"/LevLongText",this.initSelObj.LevelSet.results[0].LevLongText);
			Fragment.byId(diagId, "idInitAwardTypeBtnSbmt").setVisible(true);
		},
		onInitAwardTypeHelpSubmit: function(oE) {
			debugger;
			this._initAwScreen.then(function(oValueHelpDialog) {
				oValueHelpDialog.close();
			}.bind(this));
			debugger
		},
		onAwTypeSelected: function(oE) {
			debugger;
			if (sap.ui.getCore().byId("awardTypeId").getSelectedKey() !== "C") {
				return;
			};
			var oView = this.getView();
			this._initAwScreen = Fragment.load({
					id: oView.getId() + "initAward", // Unique ID for the fragment
					name: "ZHR_RaA.fragment.InitAwardType",
					controller: this
				}).then(function(oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					return oValueHelpDialog;
				}.bind(this));
			this._initAwScreen.then(function(oValueHelpDialog) {
				oValueHelpDialog.setEscapeHandler(function(oPromise) {
					oPromise.reject();
				});
				oValueHelpDialog.open();
			}.bind(this));	
		},
		onPressAwardType: function(oE) {
			var oView = this.getView(),
				sPath = oE.getSource().getBindingContext("mModel").getPath(); // Unique path for the employee

			// Initialize a map to store fragments if it doesn't exist
			if (!this._awardValueHelpDialogs) {
				this._awardValueHelpDialogs = {};
			}

			// Check if a fragment already exists for this employee
			if (!this._awardValueHelpDialogs[sPath]) {
				// Create a new fragment for this employee
				this._awardValueHelpDialogs[sPath] = Fragment.load({
					id: oView.getId() + sPath.replace(/\//g, "_"), // Unique ID for the fragment
					name: "ZHR_RaA.fragment.AwardType",
					controller: this
				}).then(function(oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					
				// Store the path in dialog's custom data
					this.selPath = sPath;

					return oValueHelpDialog;
				}.bind(this));
			}

			// Open the fragment for the current employee
			this._awardValueHelpDialogs[sPath].then(function(oValueHelpDialog) {
				oValueHelpDialog.open();
				oValueHelpDialog.data("path", sPath); // Pass the employee's path to the fragment
				this.selPath = sPath;
			}.bind(this));
		},
		onAwardTypeHelpClose: function(oEvent) {
					var sPath = this.selPath;
					this.getModel("mModel").getProperty("/AwardSet").forEach(function (item) {
						item.LevLongText = "";
					});
					var oDialog = this._awardValueHelpDialogs[sPath]; 
					oDialog.then(function(oDialogInstance) {
						oDialogInstance.close();
					}.bind(this));   			
		},
		onAfterAwardTypeDialogOpen: function(oEvent) {	
						if (!this.initSelObjPath) {
							return;
						}
						var oDialog = oEvent.getSource();
						var aRbContent = oDialog.getContent()[0];
						aRbContent.getItems().forEach(function(item, index){
							let aRBMain = item.getContent()[0].getItems()[0];
							aRBMain.setSelected(false);
							aRBMain.setEnabled(false);
						})
						
						debugger
						var initSelPath = this.initSelObjPath.at(-1);
						var sPath = this.selPath;
						var aSelRBContent = aRbContent.getItems()[initSelPath];
						var oSelRBMain = aSelRBContent.getContent()[0].getItems()[0];
						oSelRBMain.setSelected(true);
						var oView = this.getView();
					var sFragmentId = oView.getId() + sPath.replace(/\//g, "_");
					var	oAward = this.initSelObj,
						aContent = oDialog.getContent(),
						oAwardInput = Fragment.byId(sFragmentId, "inpAmount"),
						bCashAward = this.getModel("mModel").getProperty("/form/typeAward") === "C",
						aAwardSet = this.getModel("mModel").getProperty("/AwardSet"),
						bShowJust = oAward.ShowJust !== undefined ? oAward.ShowJust : oAward.LevelSet.results[0].ShowJust,
						bShowAttach = oAward.ShowAttach !== undefined ? oAward.ShowAttach : oAward.LevelSet.results[0].ShowAttach;
						this._setJustificationVisibility(sPath, bShowJust);
						this._setAttachmentVisibility(sPath, bShowAttach);
					if (!oAwardInput.getEnabled() && bCashAward) {
						oAwardInput.setEnabled(true);
					}
					
						if (oAward.LevelSet) {
							oAward.LevLongText = oAward.LevelSet.results[0].LevLongText;
							var oRadioButtonGroup = aSelRBContent.getContent()[1].getItems()[0];
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
					
					this.getModel("mModel").refresh();
		},
		onAwardTypeHelpSubmit: function(oEvent) {
			var oDialog = oEvent.getSource().getParent();
    // Retrieve the sPath from the dialog's data
			var sPath = oDialog.data("path");
			var awardSetArray = this.getModel("mModel").getProperty("/AwardSet");
			awardSetArray.forEach(function(item) {
				item.LevLongText = "";
			});
			var oView = this.getView();
			var sFragmentId = oView.getId() + sPath.replace(/\//g, "_");
			// Access the dialog for the current employee using the sPath
			var oDialog = this._awardValueHelpDialogs[sPath]; 

			if (oDialog) {
				oDialog.then(function(oDialogInstance) {
					var sPath = oDialogInstance.data("path"),
						sReason = Fragment.byId(sFragmentId, "inpIndividualReason").getValue(),
						sDateValue = Fragment.byId(sFragmentId, "dateInput").getValue(),
						sDate = sDateValue ? new Date(sDateValue).toISOString().split(".")[0] : null,
						sValue = Fragment.byId(sFragmentId, "inpAmount").getValue(),
						bCashAward = this.getModel("mModel").getProperty("/form/typeAward") === "C",
						nConst = bCashAward ? +this.getModel("mModel").getProperty("/MciSet/Betrg") : 1,
						aInf = this.getModel("mModel").getProperty("/form/inf");

					// Update the model with the submitted data
					this.getModel("mModel").setProperty(sPath + "/LvAmt", sValue);
					this.getModel("mModel").setProperty(sPath + "/InitComment", sReason);
					this.getModel("mModel").setProperty(sPath + "/AwardDate", sDate);
					this.getModel("mModel").setProperty(sPath + "/kztAmount", +sValue * nConst);
					this.totalAmountRecalculate(aInf);
					
					if (Fragment.byId(sFragmentId, "uploadsetBox").getVisible()) {
						if(!sDateValue){
							MessageBox.error(this.oResourceBundle.getText("dateError"));
							return;
						}	
	// Format to yyyymmdd
						var ogDate = Fragment.byId(sFragmentId, "dateInput").getDateValue();
						var year = ogDate.getFullYear();
						var month = String(ogDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
						var day = String(ogDate.getDate()).padStart(2, '0');

						var formattedDate = `${year}${month}${day}`;
						console.log("Formatted Date:", formattedDate);

						var pernr = this.getModel("mModel").getProperty(sPath + "/Pernr");
						this.uplArray[pernr] = [Fragment.byId(sFragmentId, "UploadSet"),formattedDate];
					}
					// Close the dialog but do not destroy it
					oDialogInstance.close();
				}.bind(this));
			} else {
				console.error("Dialog instance not found for the given path.");
			}
},
		
		onPressEmployee: function(oE) {
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
			aInfSend.forEach((emp, index) => {
				const empId = emp.Pernr;
				const empAttachments = [];
				const uplObject = this.uplArray;
				// Check if uplObject has data for this employee
				if (uplObject[empId] && uplObject[empId][0]) {
					const incompleteItems = uplObject[empId][0].getIncompleteItems();

					incompleteItems.forEach(item => {
						empAttachments.push({
							FileName: item.getFileName(),
							FileType: item.getMediaType(),
							Pernr: empId,
							Id: empId + "_" + item.getFileName() // Unique ID for the attachment
						});
					});
				}

				// Assign attachments to the employee object
				aInfSend[index].Attachments = empAttachments;
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
					RnaEmployeesSet: aInfSend,
					UserAction: 'C'
				};
			// Store data for later use in triggerActualCreate
			this._submissionData = data;
			this.oBusy.open();
			// First call: validation with isCreate = false
			this._validateBeforeCreate(data);
		},

		/**
		 * Validates the form data before showing COI dialog
		 * Sends a create request to backend with isCreate flag set to false
		 * @param {Object} data - The submission data to validate
		 */
		_validateBeforeCreate: function(data) {
			var that = this;
			this.getOwnerComponent().getModel().create("/RnaFormSet", data, {
				success: function(oData) {
					that.oBusy.close();
					// Validation successful, now show COI dialog
					that.showCOIDialog();
				},
				error: function(error) {
					that.oBusy.close();
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
				}
			});
		},

		/**
		 * Shows COI (Conflict of Interest) Dialog to inform user about policies
		 * Dialog has only one button 'Confirm' which triggers actual create
		 */
		showCOIDialog: function() {
			var that = this;
			var oDialog = new Dialog({
				title: this.oResourceBundle.getText("COIDialogTitle") || "Conflict of Interest Policy",
				type: "Message",
				state: "Warning",
				content: [
					new HTML({
						content: this.oResourceBundle.getText("COIDialogMessage") || "Please review our Conflict of Interest policies before proceeding."
					})
				],
				beginButton: new Button({
					text: this.oResourceBundle.getText("Confirm") || "Confirm",
					press: function() {
						oDialog.close();
						oDialog.destroy();
						// User confirmed, now trigger actual create with isCreate = true
						that.triggerActualCreate();
					}
				}),
				afterClose: function(oEvent) {
					// Cleanup
					oDialog.destroy();
				}
			});
			oDialog.open();
		},

		/**
		 * Triggers the actual create call to backend with isCreate flag set to true
		 * This is called after user confirms the COI dialog
		 */
		triggerActualCreate: function() {
			var that = this;
			// Update the flag to true for actual creation
			var data = this._submissionData;
			data.UserAction = 'P';
			
			this.oBusy.open();
			this.getOwnerComponent().getModel().create("/RnaFormSet", data, {
				success: function(oData) {
					// Retrieve the ID from the response
					var sId = oData.IdRna;
					// Proceed to upload attachments
					that._uploadAttachments(sId);
					that.oBusy.close();
					MessageToast.show(that.oResourceBundle.getText("success"));
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNavigator.toExternal({
						target: {shellHash: "#Shell-home"}
					});
				},
				error: function(error) {
					that.oBusy.close();
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
				}
			});
		},

		_uploadAttachments: function(sId) {		
			debugger;	
			// Get CSRF token
			var sCsrfToken = this.getView().getModel().getSecurityToken();
			
			Object.entries(this.uplArray).forEach(([key, values]) => {
			console.log("Key:", key);
			console.log("Value 1:", values[0]);
			console.log("Value 2:", values[1]);
			var aItemsToBeUploaded = values[0].getIncompleteItems();
			var oUploadSet = values[0];

			if (aItemsToBeUploaded.length > 0) {

				aItemsToBeUploaded.forEach(function(oItem) {
					oUploadSet.removeAllHeaderFields();
					// Construct the slug value
					var slugValue = sId + "|" + key + "|" + values[1] + "|" + oItem.getFileName();
					slugValue = encodeURIComponent(slugValue);

					// Add custom headers using sap.ui.core.Item
					oUploadSet.addHeaderField(new sap.ui.core.Item({
						key: "x-csrf-token",
						text: sCsrfToken
					}));
					oUploadSet.addHeaderField(new sap.ui.core.Item({
						key: "slug",
						text: slugValue
					}));

					// Trigger the upload
					oUploadSet.uploadItem(oItem);
				});
			}
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