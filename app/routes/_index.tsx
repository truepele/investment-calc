// app/routes/_index.tsx
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

import { runInvestmentCalculations } from "~/utils/calc.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const results = runInvestmentCalculations(formData);
  return json(results);
};

export default function Index() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Real Estate Purchase / Investment Calculator</h1>

      <div className="mb-4">
        <label className="mr-2">Select Mode:</label>
        <select name="mode" disabled className="border rounded px-2 py-1">
          <option value="investment">Investment Property</option>
          <option value="primary">Primary Residence</option>
        </select>
      </div>

      <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Left side fields */}
        <div className="flex flex-col space-y-2">
          <label className="flex flex-col">
            Purchase Price Listing
            <input
              type="number"
              step="any"
              name="purchase_price_listing"
              className="border rounded px-2 py-1"
              defaultValue="500000"
            />
          </label>

          <label className="flex flex-col">
            GST Rate (decimal)
            <input
              type="number"
              step="any"
              name="gst_rate"
              className="border rounded px-2 py-1"
              defaultValue="0.05"
            />
          </label>

          <label className="flex flex-col">
            Downpayment % (decimal)
            <input
              type="number"
              step="any"
              name="downpayment_percent"
              className="border rounded px-2 py-1"
              defaultValue="0.20"
            />
          </label>

          <label className="flex flex-col">
            Mortgage Rate (decimal)
            <input
              type="number"
              step="any"
              name="mortgage_rate"
              className="border rounded px-2 py-1"
              defaultValue="0.05"
            />
          </label>

          <label className="flex flex-col">
            Amortization Years
            <input
              type="number"
              step="1"
              name="amortization_years"
              className="border rounded px-2 py-1"
              defaultValue="25"
            />
          </label>

          <label className="flex flex-col">
            Development Years
            <input
              type="number"
              step="1"
              name="development_years"
              className="border rounded px-2 py-1"
              defaultValue="2"
            />
          </label>

          <label className="flex flex-col">
            Rent Years
            <input
              type="number"
              step="1"
              name="rent_years"
              className="border rounded px-2 py-1"
              defaultValue="3"
            />
          </label>

          <label className="flex flex-col">
            Yearly Appreciation Rate (decimal)
            <input
              type="number"
              step="any"
              name="yearly_appreciation_rate"
              className="border rounded px-2 py-1"
              defaultValue="0.03"
            />
          </label>
        </div>

        {/* Right side fields */}
        <div className="flex flex-col space-y-2">
          <label className="flex flex-col">
            Inflation Rate (decimal)
            <input
              type="number"
              step="any"
              name="inflation_rate"
              className="border rounded px-2 py-1"
              defaultValue="0.02"
            />
          </label>

          <label className="flex flex-col">
            Marginal Tax Rate (decimal)
            <input
              type="number"
              step="any"
              name="marginal_tax_rate"
              className="border rounded px-2 py-1"
              defaultValue="0.35"
            />
          </label>

          <label className="flex flex-col">
            Realtor Fee Rate Threshold
            <input
              type="number"
              step="any"
              name="realtor_fee_rate_threshold"
              className="border rounded px-2 py-1"
              defaultValue="100000"
            />
          </label>

          <label className="flex flex-col">
            Realtor Fee Rate Until Threshold (decimal)
            <input
              type="number"
              step="any"
              name="realtor_fee_rate_until_threshold"
              className="border rounded px-2 py-1"
              defaultValue="0.03"
            />
          </label>

          <label className="flex flex-col">
            Realtor Fee Rate Above Threshold (decimal)
            <input
              type="number"
              step="any"
              name="realtor_fee_rate_above_threshold"
              className="border rounded px-2 py-1"
              defaultValue="0.025"
            />
          </label>

          <label className="flex flex-col">
            Property Transfer Tax Rate Threshold
            <input
              type="number"
              step="any"
              name="property_transfer_tax_rate_threshold"
              className="border rounded px-2 py-1"
              defaultValue="200000"
            />
          </label>

          <label className="flex flex-col">
            Property Transfer Tax Rate Until Threshold (decimal)
            <input
              type="number"
              step="any"
              name="property_transfer_tax_rate_until_threshold"
              className="border rounded px-2 py-1"
              defaultValue="0.01"
            />
          </label>

          <label className="flex flex-col">
            Property Transfer Tax Rate Above Threshold (decimal)
            <input
              type="number"
              step="any"
              name="property_transfer_tax_rate_above_threshold"
              className="border rounded px-2 py-1"
              defaultValue="0.02"
            />
          </label>
        </div>

        {/* Third row, spanning both columns */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <label className="flex flex-col">
            Starting Rent Per Month
            <input
              type="number"
              step="any"
              name="starting_rent_per_month"
              className="border rounded px-2 py-1"
              defaultValue="1800"
            />
          </label>

          <label className="flex flex-col">
            Closing Legal/Notary Fees (purchase)
            <input
              type="number"
              step="any"
              name="closing_legal_notary_fees"
              className="border rounded px-2 py-1"
              defaultValue="1200"
            />
          </label>

          <label className="flex flex-col">
            Selling Legal/Notary Fees
            <input
              type="number"
              step="any"
              name="selling_legal_notary_fees"
              className="border rounded px-2 py-1"
              defaultValue="1000"
            />
          </label>

          <label className="flex flex-col">
            Maintenance/Repairs Monthly
            <input
              type="number"
              step="any"
              name="maintenance_repairs_monthly"
              className="border rounded px-2 py-1"
              defaultValue="80"
            />
          </label>

          <label className="flex flex-col">
            Strata Fee Monthly
            <input
              type="number"
              step="any"
              name="strata_fee_monthly"
              className="border rounded px-2 py-1"
              defaultValue="250"
            />
          </label>

          <label className="flex flex-col">
            Insurance Monthly
            <input
              type="number"
              step="any"
              name="insurance_monthly"
              className="border rounded px-2 py-1"
              defaultValue="40"
            />
          </label>

          <label className="flex flex-col">
            Property Tax Yearly
            <input
              type="number"
              step="any"
              name="property_tax_yearly"
              className="border rounded px-2 py-1"
              defaultValue="2500"
            />
          </label>
        </div>

        <button
          type="submit"
          className="md:col-span-2 bg-blue-600 text-white py-2 mt-4 rounded hover:bg-blue-700 transition"
          disabled={navigation.state === "submitting"}
        >
          {navigation.state === "submitting" ? "Calculating..." : "Calculate"}
        </button>
      </Form>

      {/* Display Results */}
      {data && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Results</h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-left">Label</th>
                <th className="border border-gray-300 px-2 py-1 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              <ResultsRow label="Downpayment" value={data.downpayment} />
              <ResultsRow label="Mortgage Amount" value={data.mortgageAmount} />
              <ResultsRow label="Monthly Mortgage Payment" value={data.monthlyPayment} />
              <ResultsRow label="Mortgage Interest Total" value={data.totalInterestPaid} />
              <ResultsRow
                label="Total Purchase Price w/ GST"
                value={data.totalPurchasePriceWithGst}
              />
              <ResultsRow
                label="Selling Price (after appreciation)"
                value={data.sellPrice}
              />
              <ResultsRow
                label="Closing Costs (purchase)"
                value={data.totalClosingCosts}
              />
              <ResultsRow
                label="Property Transfer Tax"
                value={data.propertyTransferTax}
              />
              <ResultsRow
                label="Legal/Notary on purchase"
                value={data.closingLegalNotaryFees}
              />
              <ResultsRow label="Adjusted Cost Base" value={data.adjustedCostBase} />
              <ResultsRow
                label="Selling Costs (total)"
                value={data.totalSellingCosts}
              />
              <ResultsRow
                label="Realtor Fee on sale"
                value={data.realtorFeeOnSale}
              />
              <ResultsRow
                label="Legal/Notary on sale"
                value={data.sellingLegalNotary}
              />
              <ResultsRow
                label="Mortgage termination (approx)"
                value={data.varMortgageTermination}
              />
              <ResultsRow
                label="One-time rent realtor fee"
                value={data.oneTimeRentRealtorFee}
              />
              <ResultsRow
                label="Maintenance/repairs total"
                value={data.maintenanceRepairsTotal}
              />
              <ResultsRow
                label="Strata fee total"
                value={data.strataFeeTotal}
              />
              <ResultsRow
                label="Insurance total"
                value={data.insuranceTotal}
              />
              <ResultsRow
                label="Mortgage interest total"
                value={data.totalInterestPaid}
              />
              <ResultsRow
                label="Property tax total"
                value={data.propertyTaxTotal}
              />
              <ResultsRow
                label="Gross rental income"
                value={data.grossRentalIncomeTotal}
              />
              <ResultsRow
                label="Net rental income"
                value={data.netRentalIncomeTotal}
              />
              <ResultsRow
                label="Capital gain"
                value={data.capitalGain}
              />
              <ResultsRow
                label="Net capital gain after tax"
                value={data.netCapitalGainAfterTax}
              />
              <ResultsRow
                label="Invested amount"
                value={data.investedAmount}
              />
              <ResultsRow
                label="Net profit (Cap. gain + Rent)"
                value={data.netProfit}
              />
              <ResultsRow
                label="Inflation-adjusted net profit"
                value={data.inflationAdjustedNetProfit}
              />
              <ResultsRow label="ROI rate (%)" value={data.roiRate * 100} />
              <ResultsRow
                label="Infl.-adjusted ROI rate (%)"
                value={data.inflationAdjustedRoiRate * 100}
              />
              <ResultsRow
                label="Avg yearly ROI rate (%)"
                value={data.avgYearlyRoiRate * 100}
              />
              <ResultsRow
                label="Infl.-adjusted avg yearly ROI (%)"
                value={data.inflationAdjustedAvgYearlyRoiRate * 100}
              />
              <ResultsRow
                label="Mortgage principal repaid"
                value={data.principalPaid}
              />
              <ResultsRow
                label="Remaining Mortgage principal"
                value={data.remainingPrincipal}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Renders a table row with Label and Value, formatted to 2 decimals. */
function ResultsRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td className="border border-gray-300 px-2 py-1">{label}</td>
      <td className="border border-gray-300 px-2 py-1 text-right">
        {value?.toFixed(2)}
      </td>
    </tr>
  );
}
