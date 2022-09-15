/* eslint-disable spaced-comment */
/* eslint-disable no-var */
/* jshint esnext: true */
sap.ui.define(
  ["./BaseController",
    "sap/m/MessageBox"
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   * @param {typeof sap.m.MessageBox} MessageBox 
 */
  function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("nu.sd.asotcc.controller.MainView", {
      onInit: function () {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("mainView").attachPatternMatched(this.onPageLoaded, this);
      },
      /**
       * @override
       */
      onPageLoaded: function () {
        this.initView();
      },
      initView: function () {
        this.appConfig = this.getOwnerComponent().appConfig.getData();
      },
      onPressSingle: function (oEvent) {
        this.oRouter.navTo("createView");
      },
      onPressMass: function (oEvent) {
        this.oRouter.navTo("massView");
      },
      onPressDownloadTemplate: function (oEvent) {
        //directly download the template file
        this.byId("downButton").setBusy(true);
        this.getTemplateHeaders().then((oHeaders) => {
            this.getOwnerComponent().oXlsxUtils.getTemplate(undefined, oHeaders, this.appConfig.templateName);
          })
          .catch(() => {
            MessageBox.error("No Template found");
          })
          .finally(() => {
            this.byId("downButton").setBusy(false);
          });
      },
      onPressDownloadPlant: function (oEvent) {
        this.oRouter.navTo("downloadView");
      },
      getTemplateHeaders: function () {
        var url = "/actionSet";
        var that = this;
        var oPayload = {
          actionKey: "TEMPLATE",
          toXLSX: []
        };
        return new Promise(function (resolve, reject) {
          that.getModel().create(url, oPayload, {
            success: function (res) {
              if (res.toXLSX.results && res.toXLSX.results.length > 0) {
                var oHeaders = {};
                for (const key in res.toXLSX.results[0]) {
                  if (key !== "__metadata") {
                    oHeaders[res.toXLSX.results[0][key]] = "";
                  }
                }
                resolve(oHeaders);
              }
              reject();
            },
            error: function (err) {
              reject(err);
            }
          });
        });
      }
    });
  }
);