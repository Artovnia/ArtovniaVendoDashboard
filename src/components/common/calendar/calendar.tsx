'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { ChevronLeft, ChevronRight } from '@medusajs/icons';
import { clx } from '@medusajs/ui';

import 'react-day-picker/dist/style.css';

export type CalendarProps = React.ComponentProps<
  typeof DayPicker
>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={clx('p-3', className)}
      classNames={{
        months:
          'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4 flex flex-col items-center',
        caption:
          'flex justify-center pt-1 relative items-center ',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: clx(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: clx(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: clx(
          'h-8 w-8 p-0 font-normal text-center transition-colors',
          'hover:bg-ui-bg-subtle-hover rounded-md'
        ),
        button_next: 'absolute right-0',
        button_previous: 'absolute left-0',
        day_button: 'w-full h-full flex items-center justify-center',
        selected: clx(
          'bg-ui-bg-highlight text-black dark:text-ui-fg-on-color font-normal rounded-full',
          'hover:bg-ui-bg-highlight hover:text-black/90 dark:hover:text-ui-fg-on-color'
        ),
        range_start: clx(
          'bg-ui-bg-highlight text-black dark:text-ui-fg-on-color font-normal',
          '!rounded-l-full !rounded-r-none'
        ),
        range_end: clx(
          'bg-ui-bg-highlight text-black dark:text-ui-fg-on-color font-normal',
          '!rounded-r-full !rounded-l-none'
        ),
        range_middle: clx(
          'bg-ui-bg-highlight/10 text-ui-fg-base',
          '!rounded-none'
        ),
        today: 'font-bold border-2 border-ui-border-interactive rounded-md',
        outside: 'text-ui-fg-muted opacity-50',
        disabled: 'text-ui-fg-disabled opacity-30 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
