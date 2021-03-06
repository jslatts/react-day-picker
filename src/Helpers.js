import {
  clone,
  isSameDay,
  isDayInRange,
  isDayAfter,
  isDayBefore,
} from './DateUtils';
import { getFirstDayOfWeek } from './LocaleUtils';

export function cancelEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

export function getFirstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

export function getDaysInMonth(d) {
  const resultDate = getFirstDayOfMonth(d);

  resultDate.setMonth(resultDate.getMonth() + 1);
  resultDate.setDate(resultDate.getDate() - 1);

  return resultDate.getDate();
}

export function getModifiersFromProps(props) {
  const modifiers = { ...props.modifiers };
  if (props.selectedDays) {
    modifiers[props.classNames.selected] = props.selectedDays;
  }
  if (props.disabledDays) {
    modifiers[props.classNames.disabled] = props.disabledDays;
  }
  return modifiers;
}

export function getFirstDayOfWeekFromProps(props) {
  const { firstDayOfWeek, locale = 'en', localeUtils = {} } = props;
  if (!isNaN(firstDayOfWeek)) {
    return firstDayOfWeek;
  }
  if (localeUtils.getFirstDayOfWeek) {
    return localeUtils.getFirstDayOfWeek(locale);
  }
  return 0;
}

export function isRangeOfDates(value) {
  return !!(value && value.from && value.to);
}

export function getModifiersForDay(d, modifiersObj = {}) {
  return Object.keys(modifiersObj).reduce((modifiers, modifier) => {
    const value = modifiersObj[modifier];
    if (!value) {
      return modifiers;
    }
    if (value instanceof Date && isSameDay(d, value)) {
      // modifier's value is a date
      modifiers.push(modifier);
    } else if (value instanceof Array) {
      // modifier's value is an array
      if (
        value.some(day => {
          if (!day) {
            return false;
          }
          if (day instanceof Date) {
            // this value of the array is a date
            return isSameDay(d, day);
          }
          if (isRangeOfDates(day)) {
            // this value of the array is a range
            const range = day;
            return isDayInRange(d, range);
          }
          if (day.after) {
            return isDayAfter(d, day.after);
          }
          if (day.before) {
            return isDayBefore(d, day.before);
          }
          if (typeof day === 'function' && day(d)) {
            return true;
          }
          return false;
        })
      ) {
        modifiers.push(modifier);
      }
    } else if (isRangeOfDates(value) && isDayInRange(d, value)) {
      // modifier's value is a range
      modifiers.push(modifier);
    } else if (value.after && isDayAfter(d, value.after)) {
      // modifier's value has an after date
      modifiers.push(modifier);
    } else if (value.before && isDayBefore(d, value.before)) {
      // modifier's value has an after date
      modifiers.push(modifier);
    } else if (typeof value === 'function' && value(d)) {
      // modifier's value is a function
      modifiers.push(modifier);
    }
    return modifiers;
  }, []);
}

export function getMonthsDiff(d1, d2) {
  return (
    d2.getMonth() - d1.getMonth() + 12 * (d2.getFullYear() - d1.getFullYear())
  );
}

export function getWeekArray(
  d,
  firstDayOfWeek = getFirstDayOfWeek(),
  fixedWeeks
) {
  const daysInMonth = getDaysInMonth(d);
  const dayArray = [];

  let week = [];
  const weekArray = [];

  for (let i = 1; i <= daysInMonth; i += 1) {
    dayArray.push(new Date(d.getFullYear(), d.getMonth(), i, 12));
  }

  dayArray.forEach(day => {
    if (week.length > 0 && day.getDay() === firstDayOfWeek) {
      weekArray.push(week);
      week = [];
    }
    week.push(day);
    if (dayArray.indexOf(day) === dayArray.length - 1) {
      weekArray.push(week);
    }
  });

  // unshift days to start the first week
  const firstWeek = weekArray[0];
  for (let i = 7 - firstWeek.length; i > 0; i -= 1) {
    const outsideDate = clone(firstWeek[0]);
    outsideDate.setDate(firstWeek[0].getDate() - 1);
    firstWeek.unshift(outsideDate);
  }

  // push days until the end of the last week
  const lastWeek = weekArray[weekArray.length - 1];
  for (let i = lastWeek.length; i < 7; i += 1) {
    const outsideDate = clone(lastWeek[lastWeek.length - 1]);
    outsideDate.setDate(lastWeek[lastWeek.length - 1].getDate() + 1);
    lastWeek.push(outsideDate);
  }

  // add extra weeks to reach 6 weeks
  if (fixedWeeks && weekArray.length < 6) {
    let lastExtraWeek;

    for (let i = weekArray.length; i < 6; i += 1) {
      lastExtraWeek = weekArray[weekArray.length - 1];
      const lastDay = lastExtraWeek[lastExtraWeek.length - 1];
      const extraWeek = [];

      for (let j = 0; j < 7; j += 1) {
        const outsideDate = clone(lastDay);
        outsideDate.setDate(lastDay.getDate() + j + 1);
        extraWeek.push(outsideDate);
      }

      weekArray.push(extraWeek);
    }
  }

  return weekArray;
}

export function startOfMonth(d) {
  const newDate = clone(d);
  newDate.setDate(1);
  newDate.setHours(12, 0, 0, 0); // always set noon to avoid time zone issues
  return newDate;
}
