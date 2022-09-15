// @ts-nocheck
/* eslint-disable no-console */
/* eslint-disable no-var */
sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (
  BaseController,
  JSONModel,
  Fragment,
  MessageBox,
  Filter,
  FilterOperator
) {
  "use strict";

  return BaseController.extend("nu.sd.asotcc.controller.Mass", {
    onInit: function () {
      this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      this.oRouter.getRoute("massView").attachPatternMatched(this.onPageLoaded, this);
    },
    initView: function () {
      this.setModel(new JSONModel({
        in14: true,
        in15: false,
      }), "datosGral");
      this.datosGral = this.getModel("datosGral");
      this.appConfig = this.getOwnerComponent().appConfig.getData();
    },
    onPageLoaded: function (oEvent) {
      this.initView();
    },
    getTemplateHeaders: function () {
      var url = "/actionSet";
      var that = this;
      var oPayload = {
        actionKey: "TEMPLATE",
        toXLSX: []
      };
      this.getModel().setUseBatch(false);
      return new Promise(function (resolve, reject) {
        that.getModel().create(url, oPayload, {
          success: function (res) {
            if (res.toXLSX.results && res.toXLSX.results.length > 0) {
              var oHeaders = [];
              for (const key in res.toXLSX.results[0]) {
                if (key !== "__metadata") {
                  oHeaders.push(res.toXLSX.results[0][key]);
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
    },
    onValueHelp: function (oEvent, param) {
      var oView = this.getView();
      if (!this._oDialog) {
        Fragment.load({
          id: oView.getId(),
          name: this.appConfig.fragValueHelp,
          controller: this,
        }).then(
          function (oDialog) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialog);
            console.log("Frag Search Help");
            this.loadFragSpecific(param);
            this._oDialog = oDialog;
            this._oDialog.param = param;
            oDialog.open();
          }.bind(this)
        );
      } else {
        this.loadFragSpecific(param);
        this._oDialog.open();
        this._oDialog.param = param;
      }
    },
    loadFragSpecific: function (param) {

      switch (param) {
        case "in17":
          this.ownValueHelp();
          break;
        default:
          break;
      }
    },
    ownValueHelp: function () {
      var tableSelectId = this.byId('TableSelectId');
      tableSelectId.unbindAggregation("items");
      var tableSelectTemplate = new sap.m.ColumnListItem({
        cells: [
          new sap.m.Text({
            text: "{strkorr}"
          }),
          new sap.m.Text({
            text: "{as4text}"
          })
        ]
      });
      this.byId('valueHelpField1').setText('Parent Request');
      this.byId("col2").setVisible(true);
      this.byId('valueHelpField2').setText('Short Description');
      this.byId("col3").setVisible(false);
      this.byId("col4").setVisible(false);
      this.byId("col5").setVisible(false);
      this.byId("col6").setVisible(false);
      this.byId("col7").setVisible(false);
      this.byId("col8").setVisible(false);
      this.byId("col9").setVisible(false);
      tableSelectId.bindAggregation("items", "/salesOwnSet", tableSelectTemplate);
    },
    handleValueItemPress: function (oEvent) {
      var param = this._oDialog.param;
      var aContexts = oEvent.getParameter("selectedContexts");
      var selectedItem = aContexts[0].getModel().getProperty(aContexts[0].getPath());
      var datosGral = this.datosGral.getData();
      if (aContexts && aContexts.length) {
        var field = this.getValueHelpToField(param);
        datosGral[param] = selectedItem[field];
      }
      this.datosGral.setData(datosGral);
      oEvent.getSource().getBinding("items").filter([]);
    },
    getValueHelpToField: function (param) {
      var fieldMap = {
        "in17": "strkorr",
      };
      return fieldMap[param];
    },
    onUpload: function (oEvent) {
      var datosGral = this.datosGral.getData();
      if (!this.oGlobalBusyDialog) {
        this.oGlobalBusyDialog = new sap.m.BusyDialog();
      }
      if (this.toMain && this.toMain.length > 0) {
        this.oGlobalBusyDialog.open();
        this.sendToBackForCreate(this.toMain)
          .then(function (result) {
            // setTimeout(() => {
            //   this.closeView();
            // }, 2000);
          })
          .finally(function () {
            this.oGlobalBusyDialog.close();
          }.bind(this));
      }
    },
    sendToBackForCreate: function (arrToMain) {
      var datosGral = this.datosGral.getData();
      var url = "/actionSet";
      var that = this;
      var oPayload = {
        actionKey: "UPLOAD",
        toMain: arrToMain.map((item) => {
          item.r1 = datosGral.in14 ? "X" : "";
          item.as4text = (datosGral.in14 ? (datosGral.in16 || "") : "").substring(0, 30);
          item.r2 = datosGral.in15 ? "X" : "";
          item.strkorr = datosGral.in15 ? (datosGral.in17 || "") : "";
          return item;
        }),
        toReturn: [],
        toOutput: [],
        toError: [],
      };
      this.getModel().setUseBatch(false);
      return new Promise(function (resolve, reject) {
        that.getModel().create(url, oPayload, {
          success: function (res) {
            if (res.toReturn.results && res.toReturn.results.length > 0) {
              resolve(that.displayResults(res.toReturn.results, ['message']));
            }
            if (res.toError.results && res.toError.results.length > 0) {
              resolve(that.displayResults(res.toError.results, ['Msg']));
            }
            if (res.toOutput.results && res.toOutput.results.length > 0) {
              resolve(that.displayResults(res.toOutput.results, ['Sorg', 'Msg']));
            }
          },
          error: function (err) {
            MessageBox.error(err.message);
            reject(err);
          }
        });
      });
    },
    displayResults: function (arrResults, arrProperty) {
      if (arrResults.length > 0) {
        var oResults = arrResults.map((result) => {
          //join value of array into string
          var value = arrProperty.map((property) => {
            return result[property];
          }).join(" ");
          var okFlow = value.split("&&");
          if (okFlow.length > 1) {
            return {
              C1: okFlow[0] + " " + okFlow[1],
              state: "Success"
            };
          }
          return {
            C1: value,
            state: "Error"
          };
        })
        this.getOwnerComponent().oFlowFrag.open(oResults, "Sales Org Creation Results", this.getView());

      }
    },
    closeView: function () {
      this.initView();
      this.toMain = {};
      this.oRouter.navTo("midOptionView");
    },
    /* ===========================================================
     Managed Upload
    ============================================================= */
    onHandleUploadStart: function (oEvent) {
      this.datosGral.setProperty("/atta", true);
      this.templateFile = oEvent.getParameter("files")[0];
    },
    onHandleUploadComplete: function (oEvent) {
      this.getTemplateHeaders().then((oHeaders) => {
          this.oHeaders = oHeaders;
        })
        .then(() => {
          this.getOwnerComponent().oXlsxUtils.readTemplate(this.templateFile, true)
            .then(
              (jsonObj) => {
                this.toMain = this.mapToBackend(jsonObj);
                console.log('%c', 'font-weight: bold; background-color: lightblue;font-size: large;')
              })
            .catch((error) => {
              MessageBox.error(error.responseText || error.message);
            })
            .finally(() => {
              this.datosGral.setProperty("/atta", false);
            });
        })
        .catch(() => {
          MessageBox.error("No Headers Found");
        });
    },
    mapToBackend: function (jsonObj) {
      var toMain = [];
      jsonObj.forEach((row) => {
        toMain.push({
          vkorg: row[this.oHeaders[0]] || "",
          bukrs: row[this.oHeaders[1]] || "",
          // vtext: row[this.oHeaders[1]] || "",
          // waers: row[this.oHeaders[2]] || "",
          // name1: row[this.oHeaders[3]] || "",
          // sort1: row[this.oHeaders[4]] || "",
          // street: row[this.oHeaders[5]] || "",
          // houseNum1: row[this.oHeaders[6]] || "",
          // postCode1: row[this.oHeaders[7]] || "",//(row[this.oHeaders[7]] || "").substring(0, 40),
          // city1: row[this.oHeaders[8]] || "",
          // country: row[this.oHeaders[9]] || "",
          // region: row[this.oHeaders[10]] || "",
          // langu: row[this.oHeaders[11]] || ""
        });
      });
      return toMain;
    },
    handleSearch: function (evt) {
      var param = this._oDialog.param;
      var sValue = evt.getParameter("value");
      var oBinding = evt.getParameter("itemsBinding");
      var filterProperty1;
      switch (param) {
        case "in17":
          filterProperty1 = [new Filter("strkorr", FilterOperator.Contains, sValue)];
          break;
        default:
          break;
      }
      oBinding.filter(filterProperty1);
    }
  });
});