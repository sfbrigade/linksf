;(function($) {

  var uniqueId = 0;

  $.widget('timeclick', {

    options: {
      namespace: 'timeclick',
      vertical: false,
      boxSize: 30,
      columns: 12,
      spacing: 6,
      verticalSpacing: 0,
      horizontalSpacing: 10,

      displayLabels: true,
      hourLabel: 'Hour',
      minutesLabel: 'Minutes',
      meridiemLabel: '&nbsp;',
      emptyMessage: 'Select a time...',

      altField: null,
      onDisplay: $.noop
    },

    _create: function() {
      var options = this.options,
          target  = this.element;

      this.time = this._scrubTime(options.time) || {}; // Holds selected time value

      if (target.attr('id')) {
        this.targetName = target.attr('id');
      } else {
        this.targetName = this.options.namespace + '_' + (uniqueId += 1);
        this.element.attr('id', this.targetName);
      }

      this._renderUI();

      target.delegate('.tp_timebox', 'click', this._clickResponse.bind(this));

      this.cssOptions = {
        width:        options.boxSize,
        height:       options.boxSize,
        fontSize:     options.boxSize * .4,
        marginRight:  options.spacing,
        marginBottom: options.spacing
      }

      $('.tp_timebox', target).css(this.cssOptions);
      $('ul', target).css({marginRight: options.horizontalSpacing});
      $('.tp_spacer', target).css({marginBottom: options.verticalSpacing});

      this._setSelected(this.time);
    },

    _renderUI: function() {
      var hour, hourLabel, hourElm, hoursElm,
          minute, minutesLabel, minuteElm, minutesElm,
          meridiem, meridiemLabel, meridiemElm, meridiemsElm,
          options = this.options,
          target  = this.element;

      if (options.displayLabels) {
        hourLabel     = (options.hourLabel == '')     ? '&nbsp;<br/>' : '<label>' + options.hourLabel + '</label><br/>';
        minutesLabel  = (options.minutesLabel == '')  ? '&nbsp;<br/>' : '<label>' + options.minutesLabel + '</label><br/>';
        meridiemLabel = (options.meridiemLabel == '') ? '&nbsp;<br/>' : '<label>' + options.meridiemLabel + '</label><br/>';
      }

      hoursElm     = $('<ul>', {html: hourLabel}).addClass('tp_hours');
      minutesElm   = $('<ul>', {html: minutesLabel}).addClass('tp_minutes');
      meridiemsElm = $('<ul>', {html: meridiemLabel}).addClass('tp_meridiems');

      for (var i = 0; i < 12; i++) {
        hour   = i + 1;
        minute = i * 5;

        // Ensure minutes are always represented by two digits
        if (i < 2) { minute = '0' + minute; }

        hourElm = $('<li>', {html: '<p>'+hour+'</p>', id: (this.targetName + '_hour_' + hour)});
        hourElm.addClass('tp_timebox tp_hour').data({hour: hour});
        hoursElm.append(hourElm);

        minuteElm = $('<li>', {html: '<p>:'+minute+'</p>', id: (this.targetName + '_minute_' + minute)});
        minuteElm.addClass('tp_timebox tp_minute').data({minute: minute});
        minutesElm.append(minuteElm);

        if (hour % options.columns == 0) {
          hoursElm.append($('<br/>'));
          minutesElm.append($('<br/>'));
        }
      }

      meridiemsElm.append(this._createMeridiemTimebox('am'));
      if (options.columns != 12) { meridiemsElm.append($('<br>')); }
      meridiemsElm.append(this._createMeridiemTimebox('pm'));

      hoursElm.append($('<div>').addClass('tp_spacer'));

      target.attr('id', this.targetName).addClass('timeclick');

      // Build Hour Minute Meridiem Layout
      target.append(hoursElm);

      if (options.vertical || options.columns == 12) {
        target.append(meridiemsElm);
        target.append($('<br>'));
        target.append(minutesElm);
      }
      else {
        target.append(minutesElm);
        target.append(meridiemsElm);
      }

      // $(['hour', 'minute', 'meridiem']).each($.proxy(function(i, type) {
      //   this.mainElm.append($('<input>', { type: 'hidden', name: (this.targetName + '_selected_' + type), id: (this.targetName + '_selected_' + type) }));
      // }, this));

      target.append($('<br>'));
      target.appendTo(this.parentElm);
    },

    _clickResponse: function(e) {
      var type, elmClass;
      var target = $(e.target).is('p') ? $(e.target).parent() : $(e.target);

      if (target.hasClass('tp_selected')) {
        target.removeClass('tp_selected');
        targetClass = target.attr('class');

        if (/tp_hour/.test(targetClass)) {
          type = 'hour';
        }
        else if (/tp_minute/.test(targetClass)) {
          type = 'minute';
        }
        else if (/tp_meridiem/.test(targetClass)) {
          type = 'meridiem';
        }

        delete this.time[type];
        this.opt.onDisplay(this.displayTime());
        this.setTime();
      }
      else {
        this._setSelected(target.data());
      }
    },

    _scrubTime: function(time) {
      if (time == null) { return null; }
      if (time.minute <= 5) { time.minute = '0' + time.minute; }
      return time;
    },

    /*
    * setSelected
    *
    * Pass a hash of the time with values:
    * hour: 1..12
    * minute: 00..55 (in 5 min. increments)
    * meridiem: 'am' || 'pm'
    *
    */
    _setSelected: function(time) {
      if (typeof time !== 'undefined') {

        // Set minutes to '00' if no minutes have been selected and an hour is selected
        if (typeof this.time.minute === 'undefined' && typeof time.minute === 'undefined' && typeof time.hour !== 'undefined') {
          time.minute = '00';
          time.meridiem = 'am';
        }

        var selectedElm;

        $(['hour', 'minute', 'meridiem']).each(function(i, type) {

          if (typeof time[type] !== 'undefined') {
            selectedElm = $('#' + this.targetName + '_' + type + '_' + time[type]);
            $('.tp_' + type, this.mainElm).removeClass('tp_selected');
            selectedElm.addClass('tp_selected');
            this.time[type] = time[type];
          }

        }.bind(this));

      }

      this.options.onDisplay(this._displayTime());
      this._setTime();
    },

    _setTime: function() {
      var options  = this.options,
          inputElm = (options.altField ? $(options.altField) : $('#' + this.targetName + '_value'));

      if (inputElm.length == 0) {
        this.element.append($('<input>', { type: 'hidden', name: (this.targetName + '_value'), id: (this.targetName + '_value')}));
        inputElm = $('#' + this.targetName + '_value');
      }


      if (this._validTime()) {
        var timeValue, twentyFourHour;

        twentyFourHour = this.time.hour % 12;

        if (this.time.meridiem == 'pm') {
          twentyFourHour += 12;
        }

        timeValue = twentyFourHour + ':' + this.time.minute + ':00';

        inputElm.val(timeValue);
      }
      else {
        inputElm.removeAttr('value');
      }
    },

    _displayTime: function() {
      return this._validTime() ? this.time.hour + ':' + this.time.minute + this.time.meridiem
                               : this.options.emptyMessage;
    },

    _validTime: function() {
      return ((typeof this.time.hour !== 'undefined') && (typeof this.time.minute !== 'undefined') && (typeof this.time.meridiem !== 'undefined'))
    },

    _createMeridiemTimebox: function(meridiem) {
      var meridiemElm = $('<li>', {html: '<p>'+meridiem+'</p>', id: (this.targetName + '_meridiem_' + meridiem)});

      meridiemElm.addClass('tp_timebox tp_meridiem').data({meridiem: meridiem});
      return meridiemElm;
    }

  });

})(jQuery);
