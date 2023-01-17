
    var mod_lic = {
        getConfigAdminLanguage: function(){
            if (mod_lic.params.config_admin_language) {
                return mod_lic.params.config_admin_language;
            } else if (typeof(module_details) != 'undefined' &&typeof(config_admin_language) != 'undefined') {
                return module_details.config_admin_language;
            } else {
                return 'en-gb';
            }
        },
        getExtensionCode: function(){
            if (mod_lic.params.extension_code) {
                return mod_lic.params.extension_code;
            } else if (typeof(module_details) != 'undefined' && typeof(extension_code) != 'undefined') {
                return module_details.extension_code;
            } else {
                return '';
            }
        },
        getModuleVersion: function(){
            if (mod_lic.params.module_version) {
                return mod_lic.params.module_version;
            } else if (typeof(module_details) != 'undefined' && typeof(module_version) != 'undefined') {
                return module_details.module_version;
            } else {
                return '1.0.0';
            }
        },
        getUrlSaveActivationKey: function(){
            if (typeof(module_details) != 'undefined' && module_details.url_save_activation_key) {
                return module_details.url_save_activation_key;
            } else {
                return '';
            }
        },
        showStatusEverywhereCustom: false,
        
        params: {},
        
        texts: {
            text_update_alert: '(new version is available)',
        },
        
        getCustomText: function(text_key){
            if (mod_lic.params.texts) {
                return mod_lic.params.texts[text_key] || '';
            }
        },
        getText: function(text_key){
            return mod_lic.getCustomText(text_key) || mod_lic.texts[text_key] || text_key;
        },
        
        getLicKey: function() {
            if ($('input[name="activation_key"]').length) { // has activation form
                return $('input[name="activation_key"]').val() || '';
            } else if (mod_lic.params.activation_key) {
                return mod_lic.params.activation_key;
            } else { // only check
                if (typeof(extension_lic_key) != 'undefined') {
                    return extension_lic_key;
                } else {
                    return '';
                }
            }
        },
        init: function(params, fn_show_status_everywhere_custom, disable_activation_form) {
        //init: function(fn_show_status_everywhere_custom, disable_activation_form) {
            
            if (params && typeof(params) == 'object') {
                mod_lic.params = $.extend(mod_lic.params, params);
            } else if (params && typeof(params) == 'string' && window[params]) {
                mod_lic.params = $.extend(mod_lic.params, window[params]);
            }
            
            if (typeof(fn_show_status_everywhere_custom) == 'function') {
                mod_lic.showStatusEverywhereCustom = fn_show_status_everywhere_custom;
            }
            
            if (!disable_activation_form) {
                
                $('input[name="activation_domain"]').val(window.location.hostname);
                $('#tab-about-button').append('&nbsp;&nbsp;<span id="status-in-tab-header"></span>');
                $('#content > .container-fluid:first').prepend('<div id="status-on-top"></div>');
                
                let lic_key = mod_lic.getLicKey();
                if (lic_key) {
                    mod_lic.showOldActivation();
                } else {
                    mod_lic.showNewActivation();
                }
                    
                
                $(':radio[name="activation_way"]').change(function(){
                    let checked_value = $(':radio[name="activation_way"]:checked').val();
                    if (checked_value == 'order_id') {
                        $('#container_activation_new_order_id').show();
                        $('#container_activation_new_key').hide();
                        $('#container_activation_new_button').show();
                        
                    } else if (checked_value == 'key') {
                        $('#container_activation_new_order_id').hide();
                        $('#container_activation_new_key').show();
                        $('#container_activation_new_button').show();
                    }
                });
                
                $('#button_activate_new').click(function(){
                    mod_lic.activateNew($(this));
                });
                $('#button_change_key').click(function(){
                    mod_lic.showNewActivation();
                });
            }
            mod_lic.updateActivationStatus();
        },
        
        initModulePage: function(params) {
            
            mod_lic.init(params);
            mod_lic.checkForUpdates(function(data){
                if (data) {
                    if (data.recommend) {
                        $('#we_recommend').html(data.recommend);
                    }
                    if (data.update) {
                        $('#tab-about-button').append('&nbsp;&nbsp;<span class="alert-warning">'+mod_lic.getText('text_update_alert')+'</span>');
                        $('#module_description').after('<hr><div class="alert alert-info" role="alert">'+data.update+'</div>');
                    }
                    if (data.product_pages) {
                        $('#module_page').html(data.product_pages);
                    }
                }
            });
        },
        
        activateNew: function($button) {
            
            let data = {
                extension_code: mod_lic.getExtensionCode(),
                lang: mod_lic.getConfigAdminLanguage(),
            };
            
            let activation_way = $(':radio[name="activation_way"]:checked').val();
            
            if (activation_way == 'order_id') {
                data.order_id = $(':input[name="activation_new_order_id"]').val();
            } else if (activation_way == 'key') {
                data.key = $(':input[name="activation_new_key"]').val();
            }
            if ($(':checkbox[name="activation_this_is_test_domain"]').is(':checked')) {
                data.this_is_test_domain = true;
            }
            
            
            $.ajax({
                type: 'POST',
                url: 'https://lic.liveopencart.com/index.php?route=extension/liveopencart/license/activate',
                data: data,
                dataType: 'json',
                cache: false,
                beforeSend: function(){
                    $button.button('loading');
                },
                complete: function(){
                    $button.button('reset');
                },
                success: function(json){
                    if (json.status) {
                        if (json.error) {
                            mod_lic.showActivationResult(json.status, 'danger');
                        } else if (json.warning) {
                            mod_lic.showActivationResult(json.status, 'warning');
                        } else {
                            mod_lic.showActivationResult(json.status, 'success');
                            mod_lic.saveActivationKey(json.key);
                            mod_lic.showOldActivation();
                            mod_lic.updateActivationStatus();
                        }
                    } else {
                        mod_lic.showStatus('unexpected response', 'danger');
                    }
                },
                error: function( jq_xhr, text_status, error_thrown){
                    console.debug(jq_xhr);
                    console.debug(text_status);
                    console.debug(error_thrown);
                },
            });
            
        },
        
        saveActivationKey: function(key){
            
            $('input[name="activation_key"]').val(key);
            
            $.ajax({
                type: 'POST',
                url: mod_lic.getUrlSaveActivationKey(),
                data: {
                    key: key,
                },
                dataType: 'json',
                cache: false,
                beforeSend: function(){
                },
                complete: function(){
                },
                success: function(json){
                    if (!json.success) {
                        console.debug(json);
                        console.debug('error on key save');
                    }
                },
                error: function( jq_xhr, text_status, error_thrown){
                    console.debug(jq_xhr);
                    console.debug(text_status);
                    console.debug(error_thrown);
                },
            });
            
        },
        
        showNewActivation() {
            $('#activation_new').show();
            $('#activation_old').hide();
            mod_lic.clearActivationResult();
        },
        
        showOldActivation() {
            $('#activation_new').hide();
            $('#activation_old').show();
        },
        
        updateActivationStatus: function(){
            let lic_key = mod_lic.getLicKey();
            $.ajax({
                type: 'POST',
                url: 'https://lic.liveopencart.com/index.php?route=extension/liveopencart/license/check',
                data: {
                    key: lic_key,
                    extension_code: mod_lic.getExtensionCode(),
                    lang: mod_lic.getConfigAdminLanguage(),
                },
                dataType: 'json',
                cache: false,
                beforeSend: function(){
                    mod_lic.showStatus('<i class="fa fa-spinner fa-pulse fa fa-fw"></i>', 'warning');
                },
                complete: function(){},
                success: function(json){
                    if (json.status) {
                        let status_type = '';
                        if (json.error) {
                            status_type = 'danger';
                        } else if (json.warning) {
                            status_type = 'warning';
                        } else {
                            status_type = 'success';
                        }
                        mod_lic.showStatusEverywhere(json.status, status_type, (json.status_description || json.status_full || json.status), (json.status_full || json.status));
                    }
                },
                error: function( jq_xhr, text_status, error_thrown){
                    console.debug(jq_xhr);
                    console.debug(text_status);
                    console.debug(error_thrown);
                },
            });
        },
        
        showStatus: function(status_text, status_type) {
            
            let html = '';
            html+= '<div class="alert alert-'+status_type+'">';
            html+= status_text;
            html+= '</div>';
            
            $('#activation_status').html(html);
        },
        
        showStatusEverywhere: function(status_text, status_type, status_description, status_full) {
            
            if (mod_lic.showStatusEverywhereCustom) {
                return mod_lic.showStatusEverywhereCustom(status_text, status_type, status_description, status_full);
            }
            
            mod_lic.showStatus(status_description, status_type);
            
            if (status_type != 'success') {
                mod_lic.showStatusInTabHeader(status_text, status_type);
                mod_lic.showStatusOnTop(status_text, status_type);
            } else {
                mod_lic.showStatusInTabHeader('');
                mod_lic.showStatusOnTop('');
            }
        },
        
        showActivationResult: function(status_text, status_type){
            let html = '';
            html+= '<span class="alert alert-'+status_type+'">';
            html+= status_text;
            html+= '</span>';
            
            $('#activation_result').html(html);
        },
        
        clearActivationResult: function(){
            $('#activation_result').html('');
        },
        
        showStatusInTabHeader: function(status_text, status_type){
            let html = '';
            if (status_type) {
                html = '<span class="alert-'+status_type+'">'+status_text+'</span>';
            } else {
                html = status_text;
            }
            $('#status-in-tab-header').html(html);
        },
        
        showStatusOnTop: function(status_text, status_type){
            let html = '';
            if (status_text) {
                html+= '<div class="alert alert-'+status_type+'">';
                html+= status_text;
                html+= '</div>';
            }
            $('#status-on-top').html(html);
        },
        
        checkForUpdates: function(success_fn) {
            $.ajax({
                url: '//update.liveopencart.com/upd.php',
                type: 'post',
                data: {
                    module: mod_lic.getExtensionCode(),
                    version: mod_lic.getModuleVersion(),
                    lang: mod_lic.getConfigAdminLanguage(),
                },
                dataType: 'json',
        
                success: function(data) {
                    success_fn(data);
                },
            });
        },
        
        // own impelementation to have not clash with possible error in jQuery ready calls
        ready: function(callback) {
            if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
                callback();
            } else {
                document.addEventListener('DOMContentLoaded', callback);
            }
        },
    
        
    };
    
    //mod_lic.initModulePage
    //
    //let params = {};
    //if (typeof('liveopencart_module_details') == 'object') {
    //    params = liveopencart_module_details;
    //}
    //
    //mod_lic.ready(function(){
    //    
    //    mod_lic.init(params);
    //    mod_lic.checkForUpdates(function(data){
    //        if (data) {
    //            if (data.recommend) {
    //                $('#we_recommend').html(data.recommend);
    //            }
    //            if (data.update) {
    //                $('#tab-about-button').append('&nbsp;&nbsp;<span class="alert-warning">'+liveprice_texts.text_update_alert+'</span>');
    //                $('#module_description').after('<hr><div class="alert alert-info" role="alert">'+data.update+'</div>');
    //            }
    //            if (data.product_pages) {
    //                $('#module_page').html(data.product_pages);
    //            }
    //        }
    //    });
    //});
    
export { mod_lic };