/* eslint-disable no-var */
/* global xlsx:true */
/* global filesaver:true */
sap.ui.define(
  [
    "sap/ui/base/ManagedObject",
    "nu/sd/asotcc/libs/filesaver",
    "nu/sd/asotcc/libs/xlsx.full.min"
  ],
  function (ManagedObject, XlsxFullmin) {
    "use strict";

    return ManagedObject.extend("nu.sd.asotcc.utils.XlsxUtils", {
      constructor: function (oComponent) {
        this._oComponent = oComponent;
      },
      /* ===========================================================
       Descargar Template
      ============================================================= */
      getTemplate: function (xlsxHeaders, oXlsxTemp, oTitle) {
        var headers = xlsxHeaders;
        var data = [{}];
        if (xlsxHeaders) {
          for (let idx = 0; idx < headers.length; idx++) {
            data[0][headers[idx]] = "dato" + (idx + 1);
          }
        } else {
          data.push(oXlsxTemp);
        }
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = {
          Sheets: {
            data: worksheet,
          },
          SheetNames: ["data"],
        };
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        console.log(excelBuffer);
        this.onSaveAsExcel(excelBuffer, oTitle);
      },
      onSaveAsExcel: function (buffer, filename) {
        const EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE
        });
        saveAs(
          data,
          filename + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      },

      /* ===========================================================
       Cargar Template
      ============================================================= */
      readTemplate: function (inFile, readBlanks) {
        return new Promise((resolve, reject) => {
          console.log("Event Handler: onHandleUploadComplete");
          var reader = new FileReader();
          reader.onload = function (e) {
            // pre-process data
            var binary = "";
            var bytes = new Uint8Array(e.target.result);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            var workbook = XLSX.read(binary, {
              type: "binary",
              cellDates: true,
              cellNF: false,
              cellText: false,
            });
            var worksheet = workbook.Sheets[workbook.SheetNames[0]];
            var ignoreBlanks = readBlanks ? false : true;
            var jsonObj = XLSX.utils.sheet_to_json(worksheet, {
              raw: false,
              dateNF: "DD-MMM-YYYY",
              blankCell: ignoreBlanks
            });
            resolve(jsonObj);
          }.bind(this);
          reader.onerror = function (err) {
            reject(err);
          }.bind(this);
          reader.readAsArrayBuffer(inFile);
        })
      },
      onDownloadAsExcel: function (data, sTitle) {
        const worksheet = XLSX.utils.json_to_sheet(data, {skipHeader: 1});
        const workbook = {
          Sheets: {
            data: worksheet,
          },
          SheetNames: ["data"],
        };
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        console.log(excelBuffer);
        this.onSaveAsExcel(excelBuffer, sTitle);
      },
    });
  }
);