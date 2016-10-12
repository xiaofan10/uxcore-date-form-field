/**
 * DateFormField Component for uxcore
 * @author eternalsky
 *
 * Copyright 2015-2016, Uxcore Team, Alinw.
 * All rights reserved.
 */

const React = require('react');
const FormField = require('uxcore-form-field');
const Constants = require('uxcore-const');
const Calendar = require('uxcore-calendar');
const assign = require('object-assign');
const deepcopy = require('lodash/cloneDeep');
const Formatter = require('uxcore-formatter');

const CalendarPanel = {
  month: Calendar.MonthCalendar,
  year: Calendar.YearCalendar,
  day: Calendar,
};

const getPropFromArray = (arr, index) => {
  if (arr instanceof Array) {
    return arr[index];
  }
  return arr;
};

class DateFormField extends FormField {

  handleChange(value, format) {
    const me = this;
    const { useFormat } = me.props;
    let data;
    if (useFormat) {
      data = format;
    } else {
      data = value ? new Date(value).getTime() : null;
    }
    me.handleDataChange(data);
  }

  handleCascadeChange(i, value, format) {
    const me = this;
    const values = deepcopy(me.state.value) || [];
    const { useFormat } = me.props;
    let data;
    if (useFormat) {
      data = format;
    } else {
      data = value ? new Date(value).getTime() : undefined;
    }
    values[i] = data;
    if (value) {
      if (i === 0 && !!values[1] && new Date(value).getTime() > new Date(values[1]).getTime()) {
        values.pop();
      }
      if (i === 1 && !!values[0] && new Date(value).getTime() < new Date(values[0]).getTime()) {
        values[0] = undefined;
      }
    }
    me.handleDataChange(values);
  }

  addSpecificClass() {
    const me = this;
    if (me.props.jsxprefixCls === 'kuma-uxform-field') {
      let str = `${me.props.jsxprefixCls} kuma-date-uxform-field`;
      if (me.props.jsxtype === 'cascade') {
        str += ' kuma-cascade-date-uxform-field';
      }
      return str;
    }
    return me.props.jsxprefixCls;
  }

  processTime(time) {
    // if showTime is true or timePicker is set, we use time to compare
    // otherwise we use day to compare
    const me = this;
    const { showTime, timePicker } = me.props;
    if (showTime || timePicker) {
      return new Date(time).getTime();
    }
    return new Date(Formatter.date(time, 'YYYY-MM-DD')).getTime();
  }
  renderField() {
    const me = this;
    /* eslint-disable no-unused-vars */
    const {
      onSelect,
      style,
      prefixCls,
      value,
      jsxtype,
      jsxfrom,
      jsxto,
      disabledDate,
      panel,
      ...others,
    } = me.props;
    /* eslint-enable no-unused-vars */
    const from = jsxfrom ? me.processTime(jsxfrom) : -Infinity;
    const to = jsxto ? me.processTime(jsxto) : Infinity;
    const mode = me.props.jsxmode || me.props.mode;
    if (mode === Constants.MODE.EDIT) {
      const Panel = CalendarPanel[panel];
      if (jsxtype === 'single') {
        return (
          <Panel
            value={me.state.value}
            onSelect={me.handleChange.bind(me)}
            disabledDate={disabledDate || ((current) => {
              // if showTime is true or timePicker is set, we use time to compare
              // otherwise we use day to compare
              if (!current) {
                return false;
              }

              return (me.processTime(current.getTime()) < from
                || me.processTime(current.getTime()) > to);
            })}
            {...others}
          />
        );
      } else if (jsxtype === 'cascade') {
        const arr = [];
        let others1 = assign({}, others);
        let others2 = assign({}, others);
        if (me.state.value && me.state.value[0]) {
          others1 = assign({}, others, {
            value: me.state.value[0],
            disabled: getPropFromArray(others.disabled, 0),
            placeholder: getPropFromArray(others.placeholder, 0),
          });
        } else {
          others1 = assign({}, others, {
            value: null,
            disabled: getPropFromArray(others.disabled, 0),
            placeholder: getPropFromArray(others.placeholder, 0),
          });
        }
        if (me.state.value && me.state.value[1]) {
          others2 = assign({}, others, {
            value: me.state.value[1],
            disabled: getPropFromArray(others.disabled, 1),
            placeholder: getPropFromArray(others.placeholder, 1),
          });
        } else {
          others2 = assign({}, others, {
            value: null,
            disabled: getPropFromArray(others.disabled, 1),
            placeholder: getPropFromArray(others.placeholder, 1),
          });
        }
        arr.push(
          <Panel
            key="calendar1"
            onSelect={me.handleCascadeChange.bind(me, 0)}
            disabledDate={(current) => {
              if (!current) {
                return false;
              }
              const now = me.processTime(current.getTime());
              return (now < from || now > to);
            }}
            {...others1}
          />
        );
        arr.push(<span key="split" className="kuma-uxform-split">-</span>);

        arr.push(
          <Panel
            key="calendar2"
            onSelect={me.handleCascadeChange.bind(me, 1)}
            disabledDate={(current) => {
              if (!current) {
                return false;
              }
              const now = me.processTime(current.getTime());
              let first = me.state.value ? me.state.value[0] : 0;
              first = me.processTime(first);
              return (now < from || now > to || now < first);
            }}
            {...others2}
          />
        );
        return arr;
      }
    } else if (mode === Constants.MODE.VIEW) {
      let defautFormat = 'YYYY-MM-DD';
      if (me.props.showTime || me.props.timePicker) {
        defautFormat = 'YYYY-MM-DD HH:mm:ss';
      }
      if (jsxtype === 'single') {
        return <span>{me.state.value ? Formatter.date(me.state.value, (me.props.format || defautFormat)) : ''}</span>;
      }
      return (
        <span>
          {me.state.value
            ? me.state.value
              .map(item => Formatter.date(item, (me.props.format || defautFormat)))
              .join(' - ')
            : ''}
        </span>
      );
    }
    return null;
  }
}

DateFormField.displayName = 'DateFormField';
DateFormField.propTypes = assign(FormField.propTypes, {
  jsxtype: React.PropTypes.string,
  panel: React.PropTypes.string,
  useFormat: React.PropTypes.bool,
});
DateFormField.defaultProps = assign(FormField.defaultProps, {
  locale: 'zh-cn',
  hasTrigger: true,
  jsxtype: 'single',
  panel: 'day',
  useFormat: false,
});
module.exports = DateFormField;
