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

  return BaseController.extend("nu.sd.asotcc.controller.Download", {
    onInit: function () {
      this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      this.oRouter.getRoute("downloadView").attachPatternMatched(this.onPageLoaded, this);
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
        case "in1":
        case "in2":
          this.f1ValueHelp();
          break;
        default:
          break;
      }
    },
    f1ValueHelp: function () {
      var tableSelectId = this.byId('TableSelectId');
      tableSelectId.unbindAggregation("items");
      var tableSelectTemplate = new sap.m.ColumnListItem({
        cells: [
          new sap.m.Text({
            text: "{Vkorg}"
          }),
          new sap.m.Text({
            text: "{Vtext}"
          })

        ]
      });
      this.byId('valueHelpField1').setText('SOrg.');
      this.byId("col2").setVisible(true);
      this.byId('valueHelpField2').setText('Name');
      this.byId("col3").setVisible(false);
      this.byId("col4").setVisible(false);
      this.byId("col5").setVisible(false);
      this.byId("col6").setVisible(false);
      this.byId("col7").setVisible(false);
      this.byId("col8").setVisible(false);
      this.byId("col9").setVisible(false);
      tableSelectId.bindAggregation("items", "/salesOrgSet", tableSelectTemplate);
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
        "in1": "Vkorg",
        "in2": "Vkorg"
      };
      return fieldMap[param];
    },
    sendToBackForCreate: function () {
      var datosGral = this.datosGral.getData();
      var url = "/actionSet";
      var that = this;
      datosGral.in1 = datosGral.in1 ? datosGral.in1 : "";
      datosGral.in2 = datosGral.in2 ? datosGral.in2 : "";
      //sort array of strings
      var range = [datosGral.in1, datosGral.in2].sort();
      if (range[0] === "") {
        range.shift();
      }
      var oPayload = {
        actionKey: "DOWNLOAD",
        toRange: [{
          Sign: "I",
          Option: range[1] ? "BT" : "EQ",
          Low: range[0],
          High: range[1] ? range[1] : ""
        }],
        toXLSX: [],
        toReturn: []
      };
      this.getModel().setUseBatch(false);
      return new Promise(function (resolve, reject) {
        that.getModel().create(url, oPayload, {
          success: function (res) {
            if (res.toReturn.results && res.toReturn.results.length > 0) {
              return reject(that.displayResults(res.toReturn.results));
            }
            if (res.toXLSX.results && res.toXLSX.results.length > 0) {
              return resolve(res.toXLSX.results);
            }
          },
          Error: function (err) {
            return reject(err);
          }
        });
      });
    },
    displayResults: function (arrResults) {
      if (arrResults.length > 0) {
        var oResults = arrResults.map((result) => {
          return result.message;
        }).join("\n");
        MessageBox.error(oResults);
      }
    },
    closeView: function () {
      this.initView();
      this.oRouter.navTo("mainView");
    },

    onDownload: function (oEvent) {
      this.sendToBackForCreate()
        .then(function (arrResults) {
          arrResults = arrResults.map((line) => {
            for (var key in line) {
              if (key.includes("_metadata")) {
                delete line[key];
              }
            }
            return line;
          });
          this.getOwnerComponent().oXlsxUtils.onDownloadAsExcel(arrResults, this.appConfig.downloadFileName);
        }.bind(this))
        .then(function () {
          // this.closeView();
        }.bind(this))
        .catch(function (err) {
          if (err) {
            MessageBox.error(err);
          }
          console.log('%c error downloading', 'font-weight: bold; background-color: lightblue;font-size: large;')
        }.bind(this));
    },
    handleSearch: function (evt) {
      var param = this._oDialog.param;
      var sValue = evt.getParameter("value");
      var oBinding = evt.getParameter("itemsBinding");
      var filterProperty1;
      switch (param) {
        case "in1":
        case "in2":
          filterProperty1 = [new Filter("Vkorg", FilterOperator.Contains, sValue)];
          break;
        default:
          break;
      }
      oBinding.filter(filterProperty1);
    }
  });
});