var $ = require('jquery');
var _ = require('underscore');

module.exports = (function() {
  var gmaps = require('google-maps'),
      Parse = require('parse'),
      Facility = require('models/facility'),
      Service  = require('models/service');

  var geocodeAddress = function(address, callback) {
    var geocoder = new gmaps.Geocoder();
    geocoder.geocode( { 'address': address }, function(results, status) {
      var geometry = results ? results[0].geometry : null;
      callback(status, geometry);
    });
  };

  var buildServices = function(facility, servicesData) {
    var i;
    var serviceObjects = _.map(servicesData, function(serviceData) {
      var service = new Service();
      service.set("facility", facility);
      service.set(serviceData);
      return service;
    });


    Service.saveAll(serviceObjects, function(services, error) {
      if (services) {
        _.each(services, function(s) { 
          var sObj = new Service();
          sObj.id = s.id;
          facility.add("services", sObj);
        });

        facility.save()
          .then(function(fac) { 

          }, function(error) { 
            console.log(error);
          });

      } else {
        console.log(error);
      }
    });
  };

  var buildFacility = function(json, callbacks) {
    var facility = new Facility();
    var geo, services;

    if ( !json.address ) return false;

    geo = json.address.replace(/\(.*\)/, '');
    geo = geo + ', San Francisco, CA';

    services = json.services;
    delete json.services;

    facility.set(json);

    geocodeAddress(geo, function(status, point) {
      if (status === gmaps.GeocoderStatus.OK) {
        facility.set('location', new Parse.GeoPoint(point.location.lat(), point.location.lng()));

        facility.save(null, {
          success: function(facility) {
            buildServices(facility, services);
            callbacks.success(facility);
          },
          error: callbacks.error
        });
      } else {
        callbacks.error("Error geocoding address: '" + geo + "' " + status);
      }
    });
  };
  return buildFacility;
})();