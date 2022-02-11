sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
	"use strict";

	return {

		prepareFilters : function (oFilterValues) {
			var aFilters = [];
			
			Object.keys(oFilterValues).forEach(function(filterName) {
				if( Array.isArray(oFilterValues[filterName]) ) {

					if( oFilterValues[filterName].length > 0 )
					{
						aFilters.push( new Filter( { filters: oFilterValues[filterName].map(function(value) {
							return new Filter(filterName, FilterOperator.EQ, value );
						} ) }, false) );
					}
					
				} 
		    });
		    
		    return aFilters;
		}

	};
});