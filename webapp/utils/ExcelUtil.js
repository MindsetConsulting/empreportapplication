sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast"
], function (JSONModel, Spreadsheet, MessageToast) {
	
	"use strict";

	return {

		exportToExcel: function (table, controller) {
			var aColumns = table.getColumns(),
				aExportColumns = [],
				aItems = table.getItems();
				
				aColumns.forEach(function(column, j) {
					if ( column.getAggregation("header") && column.getVisible() ) {
						var headerColVal = column.getAggregation("header").getText();
						
						aExportColumns.push( {
							label		: headerColVal,
							property	: "Column" + j
						} );
					} 
				} );
			
			var aData = [];
			
			aItems.forEach(function(item) {
				var aCells = item.getCells(),
				oRow = {};
				
				aColumns.forEach(function(column, j) {
					if ( column.getAggregation("header") && column.getVisible() ) {
						oRow["Column" + j] = aCells[j].getText();
					}
				});
				
				aData.push(oRow);
			} );

			var fileName = "Employee Details"
			

			var oSettings = {
				workbook	: { columns: aExportColumns },
				dataSource	: aData,
				fileName	: fileName
			},
			oSheet = new Spreadsheet(oSettings);
			
			oSheet.build().then( function() {
				MessageToast.show("Spreadsheet export has finished");
			}).finally(oSheet.destroy);			
		}
	};
});