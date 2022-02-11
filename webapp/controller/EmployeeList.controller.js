sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "emp/social/empreportapplication/utils/FilterUtil"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, FilterUtil) {
        "use strict";
        var that;
        var serviceUrl;
        return Controller.extend("emp.social.empreportapplication.controller.EmployeeList", {
            onInit: function () {
                that = this;
                serviceUrl = this.getView().getModel("empData").sServiceUrl;
                this.prepareModelForView();
                this.getTableData();
                this.setAllFiltersCombobox()
            },

            prepareModelForView: function () {

                this.getView().setModel(new JSONModel({
                    selectedDepartment: [],
                    selectedRole: [],
                    selectedLocation: [],
                    selectedAvail: [],
                    //selectedProjStatus: [],

                }), "DataModel");


            },

            setAllFiltersCombobox : function(){
                this.loadTechnicalSkills().then(function (data) {

                    that.getView().setModel(new JSONModel(data), "skillModel");

                });
            },

            loadTechnicalSkills : function(){

                return new Promise(function (resolve, reject) {
                    $.get({
                        url: serviceUrl + "/TechnicalSkillSet",
                        success: function (oData) {
                            resolve(oData.value);
                        },
                        error: function (data) {
                            reject(data);
                        }
                    });
                });
            },

            loadEmployeeTable: function () {

                //var handleFilterUrl = this.createFilter();

                return new Promise(function (resolve, reject) {
                    $.get({
                        url: serviceUrl + "/EmployeeHeaderSet" + "?$expand=Skills",
                        success: function (oData) {
                            resolve(oData.value);
                        },
                        error: function (data) {
                            reject(data);
                        }
                    });
                });
            },

            getTableData: function () {

                this.loadEmployeeTable().then(function (data) {

                    let skillsData = data.filter(item => {
                        let tempArray = item.Skills.map(set => { return set.Name });
                        let tempStr = tempArray.join();
                        item.Skills = tempStr;
                        return item;
                    });

                    let updatedData = skillsData.filter(item=>{return item.DeleteFlag === false})

                    that.getView().setModel(new JSONModel(updatedData), "empData");

                });

            },

            onPressAddEmployee: function (oEvent) {

                this.prepareModelForDialog();
                this._getDialog().open();


            },

            prepareModelForDialog: function () {
                var ramdonId = Math.floor(Math.random() * Date.now());
                var empId = "P-" + ramdonId;
                // empId = "43";

                //var email = "vishalkumar1@mindsetconsulting.com";
                var obj = {
                    "EmpId": empId,
                    "Name": "",
                    "PhoneNo": "",
                    "Email": "",
                    "About": "",
                    "Picture": "",
                    "Location": "",
                    "Role": "",
                    "Department": "",
                    "Availability": "",
                    "CurrentProject":"",
                    "DeleteFlag":false,
                    "Projects": [],
                    "Skills": []

                }
                var json = new JSONModel(obj);
                this._getDialog().setModel(json);

            },

            _getDialog: function () {
                if (!this._oDialog) {
                    // create dialog via fragment factory
                    this._oDialog = sap.ui.xmlfragment("emp.social.empreportapplication.fragments.AddNewEmployee", this);
                    // connect dialog to view (models, lifecycle)
                    this.getView().addDependent(this._oDialog);
                    this._oDialog.open();
                }
                return this._oDialog;
            },

            onDialogCancel: function (oEvent) {
                this._oDialog.close();
            },

            onDialogSave: function (oEvent) {
                var appData = this._getDialog().getModel().getData();


                this._getDialog().setBusy(true);
                this._getDialog().setBusyIndicatorDelay(0);
                var myURL = serviceUrl + "/EmployeeHeaderSet";
                $.post({
                    type: "POST",
                    url: myURL,
                    contentType: "application/json",
                    data: JSON.stringify(appData),
                    async: true,
                    success: function (response) {
                        new sap.m.MessageToast.show("Data updated successfully.");
                        this._getDialog().setBusy(false);
                        this._getDialog().close();
                        this.getTableData();


                    }.bind(this),
                    error: function (response) {
                        new sap.m.MessageToast.show("Error");
                        this._getDialog().setBusy(false);
                    }.bind(this)
                });

            },

            handleFilterChange: function (oEvent) {

                var DataModel = this.getView().getModel("DataModel");
                var filters = FilterUtil.prepareFilters({

                    Department: DataModel.getProperty("/selectedDepartment"),
                    Role: DataModel.getProperty("/selectedRole"),
                    Location: DataModel.getProperty("/selectedLocation"),
                    Availability: DataModel.getProperty("/selectedAvail")
                    //Skills: DataModel.getProperty("/selectedTechSkills")
                    //Project:DataModel.getProperty("/selectedProjStatus"),

                });

                this.getView().byId("employeeTable").getBinding("items").filter(filters);

            },

            handleTechnicalSkill : function(){

                var DataModel = this.getView().getModel("DataModel");
                var skills = DataModel.getProperty("/selectedTechSkills");
                
                var filters = []

                skills.forEach(element => {

                        filters.push(new Filter("Skills",FilterOperator.Contains,element));
                    
                });

                this.getView().byId("employeeTable").getBinding("items").filter(filters);

            },

            onSearchTable: function (oEvent) {

                var searchValue = oEvent.getSource().getValue();

                var filters = [];

                if (searchValue.trim() != '') {

                    var filterName = new Filter("Name", FilterOperator.Contains, searchValue);
                    var filterEmail = new Filter("Email", FilterOperator.Contains, searchValue);
                    var filterPhone = new Filter("PhoneNo", FilterOperator.Contains, searchValue);
                    var filterCurrProj = new Filter("CurrentProject", FilterOperator.Contains, searchValue);

                    filters = [filterName, filterEmail, filterPhone,filterCurrProj];

                    var finalFilter = new sap.ui.model.Filter({ filters: filters, and: false });

                    this.getView().byId("employeeTable").getBinding("items").filter(finalFilter);
                } else {
                    this.getView().byId("employeeTable").getBinding("items").filter([]);
                }


            },
            onTableDeleteSkill: function (oEvent) {

                that.localScope = oEvent;
                var bindingPath = oEvent.getSource().getBindingContext("empData").getPath();
				var path = oEvent.getSource().getBindingContext("empData").getPath().lastIndexOf('/') + 1;
				var dataPath = bindingPath.substring(0, path);
				var selectedIndex = bindingPath.substring(path);
				var appData = oEvent.getSource().getModel("empData").getProperty(dataPath);
				
                appData[selectedIndex].DeleteFlag = true;
                var empId = appData[selectedIndex].EmpId;		               
                //this.deleteRecordFromDatabase(appData[selectedIndex],empId);
                /*this.deleteRecordFromDatabase(appData[selectedIndex],empId).then(function () {

                     appData.splice(selectedIndex, 1);
                     //oEvent.getSource().getModel("empData").refresh();
                     new sap.m.MessageToast.show("Data Deleted successfully.");
                     that.getTableData();
                       
                },
                function(reject){
                    new sap.m.MessageToast.show("Error",reject);
                });*/
               

                if (!this.oApproveDialog) {
                    this.oApproveDialog = new sap.m.Dialog({
                        type: "Message",
                        title: "Delete Confirmation",
                        content: new sap.m.Text({ text: "Do yo want to delete this entry?" }),
                        beginButton: new sap.m.Button({
                            type: "Emphasized",
                            text: "Yes",
                            press: function () {
                                this.deleteRecordFromDatabase(appData[selectedIndex],empId).then(function () {

                                    appData.splice(selectedIndex, 1);
                                    //oEvent.getSource().getModel("empData").refresh();
                                    new sap.m.MessageToast.show("Data Deleted successfully.");
                                    that.getTableData();
                                      
                               },
                               function(reject){
                                   new sap.m.MessageToast.show("Error",reject);
                               });   
                                
                                this.oApproveDialog.close();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "No",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
    
                this.oApproveDialog.open();


				
                
			},

            onNavToEmpProfile : function(oEvent){
                var sPath =  oEvent.getSource().getBindingContext("empData").getPath();
                var navData = oEvent.getSource().getModel("empData").getProperty(sPath);
                var fetchEmail = navData.Email;
                var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
                var href_For_Product_display = (oCrossAppNav && oCrossAppNav.toExternal({
                    target: {
                        semanticObject: "empsocialempsocialapp",
                        action: "display"
                    },
                    params: {
                        "EmailId": fetchEmail
                    }
                })) || "";
            },

            deleteRecordFromDatabase : function(appData,empId){

               
                delete appData.Skills;
                var myURL = serviceUrl + "/EmployeeHeaderSet/" + empId;
                
                return new Promise(function(resolve,reject){
                $.post({
                    type: "PUT",
                    url: myURL,
                    contentType: "application/json",
                    data: JSON.stringify(appData),
                    async: true,
                    success: function (response) {

                        resolve(response);
                       

                    },
                    error: function (response) {
                        reject(response);
                       
                    }
                });
             })

              

            }

        });
    });
