sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"ZHR_RaA/model/models",
	"sap/ui/model/json/JSONModel"
], function(UIComponent, Device, models, JSONModel) {
	"use strict";

	return UIComponent.extend("ZHR_RaA.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(new JSONModel(), "mComponent");
			// this.getRouter().initialize();
			debugger;
			var that = this;
			var oBusy = new sap.m.BusyDialog();
            oBusy.setBusyIndicatorDelay(0);
			oBusy.open();
			this.getModel().read("/ProgramSet", {
				success: function(oData) {
					oBusy.close();		
					that.getRouter().initialize();
					
					var oUrlService = sap.ushell.Container.getService("URLParsing"),
					oHash = oUrlService.parseShellHash(window.location.hash);
					if (oHash && oHash.params && oHash.params.IdRna && !!oHash.params.IdRna[0]) {
						that.getRouter().navTo("approve", { 
							id: oHash.params.IdRna[0]
						});
					}
				},
				error: function(oErr) {
					debugger;
					var oErrText = JSON.parse(oErr.responseText).error.message.value;
					sap.m.MessageBox.show(oErrText, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							
							oBusy.close();
								var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
								oCrossAppNavigator.toExternal({
									target: {
										shellHash: "#Shell-home"
									}
								});
							
						}
					});
				}
			});
			// var oUrlService = sap.ushell.Container.getService("URLParsing"),
			// 	oHash = oUrlService.parseShellHash(window.location.hash);
            // if (oHash && oHash.params && oHash.params.IdRna && !!oHash.params.IdRna[0]) {
            // 	this.getRouter().navTo("approve", { 
            // 		id: oHash.params.IdRna[0]
            // 	});
            // }
		},
		
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});