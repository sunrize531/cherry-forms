define(['underscore'], function (_) {
    "use strict";
    var Utils = {},
        Unset = Utils.Unset = function () {
            this.type = 'UnsetValue';
            this.cid = _.uniqueId('__unset_');

            this.toString = function () {
                return this.cid;
            };
        },

        isUnset = Utils.isUnset = function (value) {
            return value instanceof Unset;
        },

        isSimple = Utils.isSimple = function (value) {
            return _.isString(value) ||
                _.isNumber(value) ||
                _.isBoolean(value) ||
                _.isUndefined(value) ||
                _.isNull(value);
        },

        notSet = Utils.notSet = function (value) {
            return _.isUndefined(value) || _.isNull(value);
        };

    return Utils;
});
