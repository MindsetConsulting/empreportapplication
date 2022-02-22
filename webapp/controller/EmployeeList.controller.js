sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "emp/social/empreportapplication/utils/FilterUtil",
    "emp/social/empreportapplication/utils/ExcelUtil",
    "emp/social/empreportapplication/utils/Formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, FilterUtil,ExcelUtil,Formatter) {
        "use strict";
        var that;
        var serviceUrl;
        var globalIndex;
        return Controller.extend("emp.social.empreportapplication.controller.EmployeeList", {
            formatter: Formatter,
            onInit: function () {
                that = this;
                serviceUrl = this.getView().getModel("empData").sServiceUrl;
                this.prepareModelForView();
                this.getTableData();
                this.setAllFiltersCombobox();

                /*var sValue = window.location.hash;
                /window.saveData = "myValue";
                if(sValue.includes("sap-iapp-state")){

                    this.getAppStateOnBack();
                }*/

              
            },

           

            getAppStateOnBack : function(){
                var sHash = sap.ui.core.routing.HashChanger.getInstance().getHash();
                var sAppStateKey = /(?:sap-iapp-state=)([^&=]+)/.exec(sHash)[1];
                var dataModel = this.getView().getModel("DataModel");
                
                sap.ushell.Container.getService("CrossApplicationNavigation")
                 .getAppState(sAppStateKey)
                 .done(function (savedAppData) {                     
                    dataModel.setProperty("selectedDepartment",savedAppData.getData().selectedDepartment);
                });
            },

            prepareModelForView: function () {

                this.getView().setModel(new JSONModel({
                    selectedDepartment: [],
                    selectedRole: [],
                    selectedLocation: [],
                    selectedAvail: [],
                    selectedTechSkills : [],
                    selectedProficiency: [],

                }), "DataModel");


            },

            setAllFiltersCombobox : function(){
                this.loadTechnicalSkills().then(function (data) {

                    that.getView().setModel(new JSONModel(data), "skillModel");

                });

                this.loadDepartment().then(function (data) {

                    that.getView().setModel(new JSONModel(data), "departmentModel");

                });

                this.loadRole().then(function (data) {

                    that.getView().setModel(new JSONModel(data), "roleModel");

                });

                this.loadLocation().then(function (data) {

                    that.getView().setModel(new JSONModel(data), "locationModel");

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

            loadDepartment : function(){

                return new Promise(function (resolve, reject) {
                    $.get({
                        url: serviceUrl + "/DepartmentSet",
                        success: function (oData) {
                            resolve(oData.value);
                        },
                        error: function (data) {
                            reject(data);
                        }
                    });
                });
            },

            loadRole : function(){

                return new Promise(function (resolve, reject) {
                    $.get({
                        url: serviceUrl + "/RoleSet",
                        success: function (oData) {
                            resolve(oData.value);
                        },
                        error: function (data) {
                            reject(data);
                        }
                    });
                });
            },

            loadLocation : function(){

                return new Promise(function (resolve, reject) {
                    $.get({
                        url: serviceUrl + "/LocationSet",
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

                    let skills = data.filter(item => {
                        let tempArray = item.Skills.map(set => { return {
                            "SkillName" : set.Name,
                            "SkillProf" : set.Proficiency
                        } });
                        
                        item.ProfSkills = tempArray;
                        return item;
                    });

                    let skillsData = skills.filter(item => {
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
                var checkValidate = this.checkEmailValidation();

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


            checkEmailValidation : function(){

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
               
                var bindingPath = oEvent.getSource().getBindingContext("empData").getPath();
				var path = oEvent.getSource().getBindingContext("empData").getPath().lastIndexOf('/') + 1;
				var dataPath = bindingPath.substring(0, path);
				var selectedIndex = bindingPath.substring(path);
				var appData = oEvent.getSource().getModel("empData").getProperty(dataPath);
                globalIndex = selectedIndex;
                
				
                
               // var empId = appData[tempIndex].EmpId;		               
               
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new sap.m.Dialog({
                        type: "Message",
                        title: "Delete Confirmation",
                        content: new sap.m.Text({ text: "Do yo want to delete this entry?" }),
                        beginButton: new sap.m.Button({
                            type: "Emphasized",
                            text: "Yes",
                            press: function () {
                                this.deleteRecordFromDatabase(appData[globalIndex]).then(function () {

                                    appData.splice(globalIndex, 1);
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

            onDownloadExcel : function(){
                ExcelUtil.exportToExcel(this.getView().byId("employeeTable"), this);
            },

            onNavToEmpProfile : function(oEvent){
                var sPath =  oEvent.getSource().getBindingContext("empData").getPath();
                var navData = oEvent.getSource().getModel("empData").getProperty(sPath);
                var fetchEmail = navData.Email;

                var appStateData = this.getView().getModel("DataModel").getData();
                var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");

                var oAppState = oCrossAppNav.createEmptyAppState(this.getOwnerComponent());
                oAppState.setData(appStateData);
                oAppState.save();

                var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
                var sOldHash = oHashChanger.getHash();
                var sNewHash = sOldHash + "?" + "sap-iapp-state=" + oAppState.getKey();
                oHashChanger.replaceHash(sNewHash);

                var href_For_Product_display = (oCrossAppNav && oCrossAppNav.toExternal({
                    target: {
                        semanticObject: "empsocialempsocialapp",
                        action: "display"
                    },
                    params: {
                        "EmailId": fetchEmail
                    }
                   // appStateKey : oAppState.getKey()
                })) || "";
            },

            deleteRecordFromDatabase : function(appData){

               
                delete appData.Skills;
                delete appData.ProfSkills;
                appData.DeleteFlag = true;
                var empId = appData.EmpId;
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

              

            },

            onResetFilters : function(){
                var dataModel = this.getView().getModel("DataModel");
               
                dataModel.setProperty("/selectedDepartment", []);
                dataModel.setProperty("/selectedRole", []);
                dataModel.setProperty("/selectedLocation", []);
                dataModel.setProperty("/selectedAvail", []);
                dataModel.setProperty("/selectedTechSkills", []);
                this.getTableData();
            }

        });
    });
