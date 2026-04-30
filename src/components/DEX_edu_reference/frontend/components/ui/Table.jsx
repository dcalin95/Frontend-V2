/**
 * 🎯 Table Component - Binance-Inspired Trading UI
 * 
 * Dense trading-style table:
 * - Sticky header
 * - Numeric alignment right
 * - Row hover states
 * - Compact spacing
 * 
 * @module Table
 */

import React from 'react';
import '../../styles/components/ui/table.css';

const Table = React.memo(({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="ui-table-wrapper">
      <table className={`ui-table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
});

const TableHeader = React.memo(({ children, className = '', ...props }) => (
  <thead className={`ui-table-header ${className}`} {...props}>
    {children}
  </thead>
));

TableHeader.displayName = 'TableHeader';

const TableBody = React.memo(({ children, className = '', ...props }) => (
  <tbody className={`ui-table-body ${className}`} {...props}>
    {children}
  </tbody>
));

TableBody.displayName = 'TableBody';

const TableRow = React.memo(({ children, className = '', onClick, ...props }) => (
  <tr 
    className={`ui-table-row ${onClick ? 'ui-table-row-clickable' : ''} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </tr>
));

TableRow.displayName = 'TableRow';

const TableHead = React.memo(({ children, align = 'left', className = '', ...props }) => (
  <th 
    className={`ui-table-head ui-table-head-${align} ${className}`}
    {...props}
  >
    {children}
  </th>
));

TableHead.displayName = 'TableHead';

const TableCell = React.memo(({ children, align = 'left', className = '', ...props }) => (
  <td 
    className={`ui-table-cell ui-table-cell-${align} ${className}`}
    {...props}
  >
    {children}
  </td>
));

TableCell.displayName = 'TableCell';

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

Table.displayName = 'Table';

export default Table;
