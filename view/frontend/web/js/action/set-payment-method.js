define(
    [
        'jquery',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/model/url-builder',
        'mage/storage',
        'Magento_Checkout/js/model/error-processor',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/model/full-screen-loader'
    ],
    function ($, quote, urlBuilder, storage, errorProcessor, customer, fullScreenLoader) {
        'use strict';

        return function (messageContainer, requestData, method) {
          
            var serviceUrl,
                payload,
                paymentData = quote.paymentMethod();
                
            if (!customer.isLoggedIn()) {
                serviceUrl = urlBuilder.createUrl('/guest-carts/:quoteId/payment-information', {
                    quoteId: quote.getQuoteId()
                });
                payload = {
                    cartId: quote.getQuoteId(),
                    email: quote.guestEmail,
                    paymentMethod: paymentData,
                    fuckingShippngAddress: quote.billingAddress()
                };
            } else {
                serviceUrl = urlBuilder.createUrl('/carts/mine/payment-information', {});
                payload = {
                    cartId: quote.getQuoteId(),
                    paymentMethod: paymentData,
                    billingAddress: quote.billingAddress()
                };
            }

            fullScreenLoader.startLoader();
           
            return storage.post(
                serviceUrl, JSON.stringify(payload)
            ).done(
                function (data) {
                    $.ajax({
                      method: "POST",
                      url: window.checkoutConfig.payment.dibsFlexwin.getParamsUrl,
                      data: { paytype: method, 
                              cartid: quote.getQuoteId(), 
                              orderid: data
                            },
                      dataType: 'json'
                    })
                      .done(function( jsonResponse ) {
                          //debugger;
                        if(jsonResponse.result == 'success') {
                            var requestDataArr = [];    
                            requestData.subscribe( function(){
                                $('#payment-form-dibs').submit();
                            });
                            $.each(jsonResponse.params, function (name, value) {
                                requestDataArr.push({'name':name, 'value':value});
                            });
                           requestData(requestDataArr);
                        } else {
                            fullScreenLoader.stopLoader();
                            alert(jsonResponse.message);
                            window.location.href = '/checkout/cart/';
                        }
                      });
                }
            ).fail(
                function (response) {
                    errorProcessor.process(response, messageContainer);
                    fullScreenLoader.stopLoader();
                }
            );
     
        };
    }
);