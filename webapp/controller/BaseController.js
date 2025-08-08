sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter"

], function(Controller, JSONModel, Filter) {
	"use strict";

	return Controller.extend("ZHR_RaA.controller.BaseController", {

		multiplyAndSpaces: function(nVal, nK) {
			var nResultValue = nVal * nK;
			var sResultValue = nResultValue + "";
			return sResultValue.replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ');
		},

		getModel: function(sModelName) {
			if (sModelName === "mComponent") {
				return this.getOwnerComponent().getModel("mComponent");
			}
			return this.getView().getModel(sModelName);
		},

		getAwardGroupSet: function() {
			this.getModel().read("/AwgroupSet", {
				success: function(oData) {
					this.oBusy.close();
					this.getModel("mModel").setProperty("/AwgroupSet", oData.results);
					if (!this.dialogFragment) {
						this.dialogFragment = sap.ui.xmlfragment("ZHR_RaA.fragment.Popup", this);
						sap.ui.getCore().byId("acceptBtn").attachPress(function() {
							var sAwGrp = sap.ui.getCore().byId("awardTypeId").getSelectedKey();
							this.dialogFragment.close();
							if (this.dialogFragment) {
								this.dialogFragment.destroy();
								this.dialogFragment = null;
							}
							this.getModel("mModel").setProperty("/form/typeAward", sAwGrp);
							this.getAwardSet(sAwGrp);
						}.bind(this));
					}
					this.dialogFragment.attachAfterClose(function() {
						if (this.dialogFragment) {
							this.dialogFragment.destroy();
							this.dialogFragment = null;
						}
					});
					this.dialogFragment.setEscapeHandler(function(oPromise) {
						oPromise.reject();
					});
					this.dialogFragment.setModel(this.getOwnerComponent().getModel("i18n"), "i18n");
					this.dialogFragment.setModel(this.getModel("mModel"), "mModel");
					this.dialogFragment.open();
				}.bind(this)
			});
		},

		getAwardSet: function(sAwGrp) {
			this.oBusy.open();
			this.getOwnerComponent().getModel().read("/AwardSet", {
				filters: [
					new sap.ui.model.Filter("AwGrp", "EQ", sAwGrp)
				],
				urlParameters: {
					$expand: "LevelSet"
				},
				success: function(oData) {
					this.oBusy.close();
					oData.results.forEach(function(award) {
						award.LevLongText = "";
						award.LevelSet.results.forEach(function(level) {
							level.DefValue = level.DefValue.split(".")[0];
							level.MaxValue = level.MaxValue.split(".")[0];
							level.MinValue = level.MinValue.split(".")[0];
						});
					});
					console.log("LevelSet ", oData.results);
					this.getModel("mModel").setProperty("/AwardSet", oData.results);
				}.bind(this)
			});
		},

		getEmployeeDetails: function() {
			var that = this;
			var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();
			today = yyyy + mm + dd;
			that.mCommon = that.getOwnerComponent().getModel("mCommon");
			that.oBusy.open();
			that.mCommon.read("/ConcurrentEmploymentSet", {
				filters: [
					new Filter("ApplicationId", "EQ", "MYPROFILE")
				],
				success: function(oData) {
					var sPernr = oData.results[0].EmployeeId;
					//that.selectGenManagerListBind(sPernr);
					var mCommon = new Promise(function(resolve, reject) {
							that.mCommon.read("/EmployeeDetailSet(ApplicationId='MYPROFILE',EmployeeNumber='" + sPernr + "')", {
								success: function(data) {
									var sName = data.EmployeeName.FormattedName,
										sEmail = data.WorkEmail;
									that.getModel("mModel").setProperty("/EmployeeDetails", data);
									that.getModel("mModel").setProperty("/form/InitPernr", sPernr);
									that.getModel("mModel").setProperty("/form/InitFio", sName);
									that.getModel("mModel").setProperty("/form/InitMail", sEmail);
									that.getModel("mModel").setProperty("/form/IdCostCenter", "");
									resolve();
								}
							});
						}),
						approveSet = new Promise(function(resolve, reject) {
							that.getOwnerComponent().getModel().read("/ApproverSet", {
								urlParameters: {
									Pernr: sPernr,
									$expand: "SubstituteSet"
								},
								success: function(approvers) {
									console.log("ApproverSet ", approvers.results);
									that.getModel("mModel").setProperty("/ApproverSet", approvers.results);
									resolve();
								}
							});
						}),
						genDirSet = new Promise(function(resolve, reject) {
							that.getOwnerComponent().getModel().read("/GenDirSet", {
								urlParameters: {
									Pernr: sPernr
								},
								success: function(gd) {
									console.log("GenDirSet ", gd.results);
									that.getModel("mModel").setProperty("/GenDirSet", gd.results);
									resolve();
								}
							});
						}),
						mciSet = new Promise(function(resolve, reject) {
							that.getOwnerComponent().getModel().read("/MciSet(Molga='KZ',Konst='ZMRP3',Endda='"+today+"')", {
								success: function(mci) {
									console.log("MciSet ", mci);
									mci.Betrg = mci.Betrg.split(".")[0];
									that.getModel("mModel").setProperty("/MciSet", mci);
									resolve();
								}
							});
						}),
						initLsSet = new Promise(function(resolve, reject) {
							that.getOwnerComponent().getModel().read("/InitLsSet", {
								urlParameters: {
									Pernr: sPernr
								},
								success: function(ls) {
									console.log("InitLsSet ", ls.results);
									that.getModel("mModel").setProperty("/InitLsSet", ls.results);
									resolve();
								}
							});
						});
					Promise.all([mCommon, approveSet, genDirSet, mciSet, initLsSet]).then(function() {
						that.getAwardGroupSet();
					});
				}
			});
		}
	});
});