/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define([
    "underscore",
    "contrail-model",
    "sm-basedir/setting/sm/ui/js/views/ClusterEditView",
    "knockback",
    "schema-model",
    "text!sm-basedir/setting/sm/ui/js/schemas/cluster.json",
    "sm-cluster-ui-schema",
    "sm-cluster-custom-ui-schema",
    "json-validator",
    "backbone",
    "knockout",
    "sm-constants",
    "sm-labels",
    "sm-messages",
    "sm-utils",
    "sm-model-config"
], function (_, ContrailModel, ClusterEditView, Knockback, UISchemaModel, schema, stSchema, customSchema, JsonValidator, Backbone, Knockout, smwc, smwl, smwm, smwu, smwmc) {


    var prefixId = smwc.CLUSTER_PREFIX_ID,
        defaultSchema = JSON.parse(schema),
        schemaModel = new UISchemaModel(defaultSchema, stSchema, customSchema).schema,
        jsonValidator = new JsonValidator(prefixId, smwmc.getClusterModel());

    var clusterCustomValidations = function() {
        var customValidations = {
            "parameters.provision.openstack.amqp.use_ssl": function(val, attr, computed) {
                if ("false" === val) {
                    return;
                }
                var openstackAMQP =
                    getValueByJsonPath(computed,
                                       "parameters;provision;openstack;openstack_manage_amqp",
                                       null);
                if ((false === openstackAMQP) && ("true" === val)) {
                    return "Openstack managed amqp is not enabled";
                }
            }
        };
        return customValidations;
    }

    var getValidationByKey = function (key) {
        var configureValidation = {};
        jsonValidator.addValidation(schemaModel, configureValidation);

        if (key == "provisionValidation") {
            configureValidation.package_image_id = {
                required: true,
                msg: smwm.getRequiredMessage("package_image_id")
            };
        }
        var customValidator = clusterCustomValidations();
        for (var key in customValidator) {
            configureValidation[key] = customValidator[key];
        }
        return configureValidation;
    };

    var ClusterModel = ContrailModel.extend({

        defaultConfig: smwmc.getClusterModel(),
        formatModelConfig : function(modelConfig){
            return modelConfig;
        },
        configure: function (callbackObj, ajaxMethod, validation) {
            var ajaxConfig = {}, returnFlag = false;

            validation = (validation == null) ? smwc.KEY_CONFIGURE_VALIDATION : validation;

            if (this.model().isValid(true, validation)) {
                var putData = {}, clusterAttrsEdited = [],
                    clusterAttrs = this.model().attributes,
                    clusterSchema = smwmc.getClusterSchema(),
                    locks = this.model().attributes.locks.attributes;

                clusterAttrsEdited.push(cowu.getEditConfigObj(clusterAttrs, locks, clusterSchema, ""));
                putData[smwc.CLUSTER_PREFIX_ID] = clusterAttrsEdited;

                ajaxConfig.async = false;
                ajaxConfig.type = contrail.checkIfExist(ajaxMethod) ? ajaxMethod : "PUT";
                ajaxConfig.data = JSON.stringify(putData);
                ajaxConfig.url = smwu.getObjectUrl(smwc.CLUSTER_PREFIX_ID);
                contrail.ajaxHandler(ajaxConfig, function () {
                    if (contrail.checkIfFunction(callbackObj.init)) {
                        callbackObj.init();
                    }
                }, function () {
                    if (contrail.checkIfFunction(callbackObj.success)) {
                        callbackObj.success();
                    }
                    returnFlag = true;
                }, function (error) {
                    console.log(error);
                    if (contrail.checkIfFunction(callbackObj.error)) {
                        callbackObj.error(error);
                    }
                    returnFlag = false;
                });
            } else {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(smwc.CLUSTER_PREFIX_ID));
                }
            }

            return returnFlag;
        },
        addServer: function (serverList, callbackObj) {
            var ajaxConfig = {},
                returnFlag = false;

            var clusterAttrs = this.model().attributes,
                putData = {}, servers = [];

            $.each(serverList, function (key, value) {
                servers.push({"id": value.id, "cluster_id": clusterAttrs.id});
            });
            putData[smwc.SERVER_PREFIX_ID] = servers;

            ajaxConfig.async = false;
            ajaxConfig.type = "PUT";
            ajaxConfig.data = JSON.stringify(putData);
            ajaxConfig.url = smwu.getObjectUrl(smwc.SERVER_PREFIX_ID);

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function () {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
                returnFlag = true;
            }, function (error) {
                console.log(error);
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            });

            return returnFlag;
        },
        removeServer: function (serverList, callbackObj) {
            var ajaxConfig = {},
                returnFlag = false,
                putData = {}, servers = [];

            $.each(serverList, function (key, value) {
                servers.push({"id": value.id, "cluster_id": ""});
            });

            putData[smwc.SERVER_PREFIX_ID] = servers;
            smwu.removeRolesFromServers(putData);

            ajaxConfig.async = false;
            ajaxConfig.type = "PUT";
            ajaxConfig.data = JSON.stringify(putData);
            ajaxConfig.url = smwu.getObjectUrl(smwc.SERVER_PREFIX_ID);

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function () {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
                returnFlag = true;
            }, function (error) {
                console.log(error);
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            });

            return returnFlag;
        },
        assignRoles: function (serverList, callbackObj) {
            var ajaxConfig = {}, returnFlag = false,
                putData = {}, servers = [];

            $.each(serverList, function (key, value) {
                servers.push({"id": value.id, "roles": value.roles});
            });

            putData[smwc.SERVER_PREFIX_ID] = servers;

            ajaxConfig.async = false;
            ajaxConfig.type = "PUT";
            ajaxConfig.data = JSON.stringify(putData);
            ajaxConfig.url = smwu.getObjectUrl(smwc.SERVER_PREFIX_ID);

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function () {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
                returnFlag = true;
            }, function (error) {
                console.log(error);
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            });

            return returnFlag;
        },
        reimage: function (callbackObj) {
            var ajaxConfig = {};
            if (this.model().isValid(true, smwc.KEY_REIMAGE_VALIDATION)) {
                var clusterAttrs = this.model().attributes,
                    putData = {}, clusters = [];

                clusters.push({"cluster_id": clusterAttrs.id, "base_image_id": clusterAttrs.base_image_id});
                putData = clusters;

                ajaxConfig.type = "POST";
                ajaxConfig.data = JSON.stringify(putData);
                ajaxConfig.timeout = smwc.TIMEOUT;
                ajaxConfig.url = smwc.URL_SERVER_REIMAGE;

                contrail.ajaxHandler(ajaxConfig, function () {
                    if (contrail.checkIfFunction(callbackObj.init)) {
                        callbackObj.init();
                    }
                }, function () {
                    if (contrail.checkIfFunction(callbackObj.success)) {
                        callbackObj.success();
                    }
                }, function (error) {
                    console.log(error);
                    if (contrail.checkIfFunction(callbackObj.error)) {
                        callbackObj.error(error);
                    }
                });
            } else {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(smwc.CLUSTER_PREFIX_ID));
                }
            }
        },
        provision: function (callbackObj) {
            var ajaxConfig = {};
            if (this.model().isValid(true, smwc.KEY_PROVISION_VALIDATION)) {
                var clusterAttrs = this.model().attributes,
                    putData = {}, clusters = [];

                clusters.push({"cluster_id": clusterAttrs.id, "package_image_id": clusterAttrs.package_image_id});
                putData = clusters;

                ajaxConfig.type = "POST";
                ajaxConfig.data = JSON.stringify(putData);
                ajaxConfig.timeout = smwc.TIMEOUT;
                ajaxConfig.url = smwc.URL_SERVER_PROVISION;

                contrail.ajaxHandler(ajaxConfig, function () {
                    if (contrail.checkIfFunction(callbackObj.init)) {
                        callbackObj.init();
                    }
                }, function () {
                    if (contrail.checkIfFunction(callbackObj.success)) {
                        callbackObj.success();
                    }
                }, function (error) {
                    console.log(error);
                    if (contrail.checkIfFunction(callbackObj.error)) {
                        callbackObj.error(error);
                    }
                });
            } else {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(smwc.CLUSTER_PREFIX_ID));
                }
            }
        },
        deleteCluster: function (checkedRow, callbackObj) {
            var ajaxConfig = {},
                clusterId = checkedRow.id;

            ajaxConfig.type = "DELETE";
            ajaxConfig.url = smwc.URL_OBJ_CLUSTER_ID + clusterId;

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function () {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            }, function (error) {
                console.log(error);
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
            });
        },
        runInventory: function (checkedRow, callbackObj) {
            var ajaxConfig = {},
                clusterId = checkedRow.id;

            ajaxConfig.type = "POST";
            ajaxConfig.url = smwc.URL_RUN_INVENTORY + "?cluster_id=" +clusterId;

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function () {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            }, function (error) {
                console.log(error);
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
            });
        },
        validations: {
            reimageValidation: {
                "base_image_id": {
                    required: true,
                    msg: smwm.getRequiredMessage("base_image_id")
                }
            },
            provisionValidation: getValidationByKey("provisionValidation"),
            addValidation: {
                "id": {
                    required: true,
                    msg: smwm.getRequiredMessage("id")
                },
                "email": {
                    required: false,
                    pattern: "email",
                    msg: smwm.getInvalidErrorMessage("email")
                }
            },
            configureValidation: getValidationByKey("configureValidation")
        }
    });

    return ClusterModel;
});
