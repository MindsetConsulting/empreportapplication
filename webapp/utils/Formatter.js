
sap.ui.define([], function () {
    "use strict";
    
     return {

        getProficiencyColor : function(proficiency){

                    switch(proficiency){

                        case "Expert":
                                return 5;
                        case "Intermediate":
                                return 1;
                        case "Beginner":
                                return 7;
                        default:
                                return 9;

                         }
       
    },

    getAvailabilityStatus : function(Status){
        
                        switch(Status){

                        case "Available":

                                return "Success" ;

                        case "Partially Available":

                                return "Warning";

                        case "Not Available":

                                return "Error";

                        case "Planned":

                             return "Information";
                                
                        default:
                                return 9;

                        }
    }
};
});