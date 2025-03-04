import { getEmberView } from 'toolkit/extension/utils/ember';
import { Feature } from 'toolkit/extension/features/feature';
import { l10n } from 'toolkit/extension/utils/toolkit';
import { getBudgetBreakdownEntries } from '../subtract-upcoming-from-available/budget-breakdown-monthly-totals';
import { isSavingsCategory } from '../subtract-upcoming-from-available/categories';
import { isCurrentRouteBudgetPage } from 'toolkit/extension/utils/ynab';
import { formatCurrency } from 'toolkit/extension/utils/currency';

export class ShowAvailableAfterSavings extends Feature {
  shouldInvoke() {
    return isCurrentRouteBudgetPage();
  }

  invoke() {
    this.onElement('.budget-breakdown', this.handleBudgetBreakdown);
  }

  observe() {
    this.onElement('.budget-breakdown', this.handleBudgetBreakdown);
  }

  destroy() {
    $('#tk-total-available-after-savings').remove();
  }

  handleBudgetBreakdown(element) {
    const $budgetBreakdownMonthlyTotals = $('.budget-breakdown-monthly-totals', element);
    if (!$budgetBreakdownMonthlyTotals.length) return;

    const budgetBreakdown = getEmberView(element.id);
    if (!budgetBreakdown) return;

    this.showAvailableAfterSavings(budgetBreakdown, $budgetBreakdownMonthlyTotals);
  }

  showAvailableAfterSavings(budgetBreakdown, context) {
    const totalAvailable = budgetBreakdown.budgetTotals.available;
    const totalSavings = getTotalSavings(budgetBreakdown);
    const totalAvailableAfterSavings = totalAvailable - totalSavings;

    if (totalAvailableAfterSavings === totalAvailable) return;

    if (
      $('#tk-total-available-after-savings .inspector-message-currency .currency').text() ===
      formatCurrency(totalAvailableAfterSavings)
    ) {
      return;
    }

    $('#tk-total-available-after-savings').remove();
    const $ynabBreakdown = $('.ynab-breakdown', context);

    getBudgetBreakdownEntries({
      availableAfterSavings: {
        elementId: 'tk-total-available-after-savings',
        title: l10n('toolkit.availableAfterSavings', 'Available After Savings'),
        amount: totalAvailableAfterSavings,
      },
    }).prependTo($ynabBreakdown);
  }
}

export function getTotalSavings(budgetBreakdown) {
  let totalSavings = 0;

  for (const category of budgetBreakdown.inspectorCategories) {
    if (isSavingsCategory(category))
      totalSavings += category.available < 0 ? 0 : category.available; // If available is less than 0, it will already have been subtracted from YNAB's total available.
  }

  return totalSavings;
}
