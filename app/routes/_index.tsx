import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

function calculatePropertyTransferTax(
  purchasePrice: number,
  pttThreshold: number,
  pttRateUntilThreshold: number,
  pttRateAboveThreshold: number
) {
  if (purchasePrice <= pttThreshold) {
    return purchasePrice * pttRateUntilThreshold;
  } else {
    const taxUntilThreshold = pttThreshold * pttRateUntilThreshold;
    const taxAboveThreshold = (purchasePrice - pttThreshold) * pttRateAboveThreshold;
    return taxUntilThreshold + taxAboveThreshold;
  }
}

function calculateRealtorFeeOnSale(
  sellingPrice: number,
  realtorThreshold: number,
  realtorRateUntilThreshold: number,
  realtorRateAboveThreshold: number
) {
  if (sellingPrice <= realtorThreshold) {
    return sellingPrice * realtorRateUntilThreshold;
  } else {
    const feeUntilThreshold = realtorThreshold * realtorRateUntilThreshold;
    const feeAboveThreshold =
      (sellingPrice - realtorThreshold) * realtorRateAboveThreshold;
    return feeUntilThreshold + feeAboveThreshold;
  }
}

function getMonthlyMortgagePayment(
  principal: number,
  annualInterestRate: number,
  amortizationYears: number
) {
  const monthlyInterestRate = annualInterestRate / 12.0;
  const totalPayments = amortizationYears * 12;

  if (monthlyInterestRate === 0) {
    // Edge case: zero interest
    return principal / totalPayments;
  }

  return (
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalPayments))
  );
}

/**
 * Returns:
 *  - monthlyPayment
 *  - totalInterestPaid
 *  - principalPaid
 */
function calculateMortgageInterestTotal(
  principal: number,
  annualInterestRate: number,
  amortizationYears: number,
  yearsBeforeSelling: number
) {
  const monthlyPayment = getMonthlyMortgagePayment(
    principal,
    annualInterestRate,
    amortizationYears
  );

  const monthlyInterestRate = annualInterestRate / 12.0;
  const monthsBeforeSelling = yearsBeforeSelling * 12;

  let totalInterestPaid = 0.0;
  let currentBalance = principal;

  for (let i = 0; i < monthsBeforeSelling; i++) {
    if (currentBalance <= 0) {
      break; // loan fully paid off
    }
    // interest for this month
    const interestForMonth = currentBalance * monthlyInterestRate;
    // principal portion for this month
    let principalForMonth = monthlyPayment - interestForMonth;
    if (principalForMonth > currentBalance) {
      principalForMonth = currentBalance;
    }
    totalInterestPaid += interestForMonth;
    currentBalance -= principalForMonth;
  }

  const principalPaid = principal - currentBalance;
  return { monthlyPayment, totalInterestPaid, principalPaid };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Collect all the inputs (strings), then parse to float/int.
  // Note: defaulting to 0 if not provided or invalid.
  function f(field: string) {
    return parseFloat(formData.get(field)?.toString() || "0");
  }

  const inflationRate = f("inflation_rate");
  const yearlyAppreciationRate = f("yearly_appreciation_rate");
  const developmentYears = f("development_years");
  const rentYears = f("rent_years");
  const amortizationYears = f("amortization_years");
  const mortgageRate = f("mortgage_rate");

  const realtorFeeRateThreshold = f("realtor_fee_rate_threshold");
  const realtorFeeRateUntilThreshold = f("realtor_fee_rate_until_threshold");
  const realtorFeeRateAboveThreshold = f("realtor_fee_rate_above_threshold");

  const propertyTransferTaxRateThreshold = f("property_transfer_tax_rate_threshold");
  const propertyTransferTaxRateUntilThreshold = f("property_transfer_tax_rate_until_threshold");
  const propertyTransferTaxRateAboveThreshold = f("property_transfer_tax_rate_above_threshold");

  const marginalTaxRate = f("marginal_tax_rate");
  const startingRentPerMonth = f("starting_rent_per_month");
  const purchasePriceListing = f("purchase_price_listing");
  const downpaymentPercent = f("downpayment_percent");

  const closingLegalNotaryFees = f("closing_legal_notary_fees");
  const sellingLegalNotaryFees = f("selling_legal_notary_fees");

  const maintenanceRepairsMonthly = f("maintenance_repairs_monthly");
  const strataFeeMonthly = f("strata_fee_monthly");
  const insuranceMonthly = f("insurance_monthly");
  const gstRate = f("gst_rate");
  const propertyTaxYearly = f("property_tax_yearly");

  // 3.1
  const gstOnPurchase = purchasePriceListing * gstRate;
  const totalPurchasePriceWithGst = purchasePriceListing + gstOnPurchase;

  // 3.2
  const downpayment = totalPurchasePriceWithGst * downpaymentPercent;

  // 3.3
  const mortgageAmount = totalPurchasePriceWithGst - downpayment;

  // 3.4
  const totalInvestmentYears = developmentYears + rentYears;
  const sellPrice =
    purchasePriceListing * Math.pow(1 + yearlyAppreciationRate, totalInvestmentYears);

  // 3.5
  const propertyTransferTax = calculatePropertyTransferTax(
    purchasePriceListing,
    propertyTransferTaxRateThreshold,
    propertyTransferTaxRateUntilThreshold,
    propertyTransferTaxRateAboveThreshold
  );
  const totalClosingCosts = closingLegalNotaryFees + propertyTransferTax;

  // 3.6
  const adjustedCostBase = totalPurchasePriceWithGst + totalClosingCosts;

  // 3.8.5 Mortgage interest total
  const { monthlyPayment, totalInterestPaid, principalPaid } =
    calculateMortgageInterestTotal(
      mortgageAmount,
      mortgageRate,
      amortizationYears,
      rentYears
    );
  const remainingPrincipal = mortgageAmount - principalPaid;

  // 3.7
  const realtorFeeOnSale = calculateRealtorFeeOnSale(
    sellPrice,
    realtorFeeRateThreshold,
    realtorFeeRateUntilThreshold,
    realtorFeeRateAboveThreshold
  );
  const sellingLegalNotary = sellingLegalNotaryFees;
  const varMortgageTermination = monthlyPayment * 2 * 0.7;
  const totalSellingCosts = realtorFeeOnSale + sellingLegalNotary + varMortgageTermination;

  // 3.8
  const oneTimeRentRealtorFee = startingRentPerMonth * 0.5;
  const maintenanceRepairsTotal = maintenanceRepairsMonthly * 12 * rentYears;
  const strataFeeTotal = strataFeeMonthly * 12 * rentYears;
  const insuranceTotal = insuranceMonthly * 12 * rentYears;
  const propertyTaxTotal = propertyTaxYearly * rentYears;

  // 3.9 (simple approach)
  const grossRentalIncomeTotal = startingRentPerMonth * 12 * rentYears;

  // 3.10
  const totalOwningCostsDuringRent =
    oneTimeRentRealtorFee +
    maintenanceRepairsTotal +
    strataFeeTotal +
    insuranceTotal +
    totalInterestPaid +
    propertyTaxTotal;

  const netRentalIncomeTotal = grossRentalIncomeTotal - totalOwningCostsDuringRent;

  // 3.11
  const capitalGain = sellPrice - totalSellingCosts - adjustedCostBase;

  // 3.12
  const netCapitalGainAfterTax = capitalGain - (capitalGain / 2) * marginalTaxRate;

  // 3.13
  const investedAmount = downpayment + totalClosingCosts;

  // 3.14
  const netProfit = netCapitalGainAfterTax + netRentalIncomeTotal;

  // 3.15
  const inflationFactor = Math.pow(1 + inflationRate, totalInvestmentYears);
  const inflationAdjustedNetProfit = netProfit / inflationFactor;

  // 3.16
  const roiRate = netProfit / investedAmount;

  // 3.17
  const inflationAdjustedRoiRate = inflationAdjustedNetProfit / investedAmount;

  // 3.18
  let avgYearlyRoiRate = 0;
  if (totalInvestmentYears > 0) {
    avgYearlyRoiRate = Math.pow(1 + roiRate, 1 / totalInvestmentYears) - 1;
  }

  // 3.19
  let inflationAdjustedAvgYearlyRoiRate = 0;
  if (totalInvestmentYears > 0) {
    inflationAdjustedAvgYearlyRoiRate =
      Math.pow(1 + inflationAdjustedRoiRate, 1 / totalInvestmentYears) - 1;
  }

  // Prepare results for client
  const results = {
    purchasePriceListing,
    totalPurchasePriceWithGst,
    downpayment,
    mortgageAmount,
    monthlyPayment,
    totalInterestPaid,
    sellPrice,
    totalClosingCosts,
    propertyTransferTax,
    closingLegalNotaryFees,
    adjustedCostBase,
    totalSellingCosts,
    realtorFeeOnSale,
    sellingLegalNotary,
    varMortgageTermination,
    oneTimeRentRealtorFee,
    maintenanceRepairsTotal,
    strataFeeTotal,
    insuranceTotal,
    propertyTaxTotal,
    grossRentalIncomeTotal,
    netRentalIncomeTotal,
    capitalGain,
    netCapitalGainAfterTax,
    investedAmount,
    netProfit,
    inflationAdjustedNetProfit,
    roiRate,
    inflationAdjustedRoiRate,
    avgYearlyRoiRate,
    inflationAdjustedAvgYearlyRoiRate,
    principalPaid,
    remainingPrincipal
  };

  return json(results);
};

export default function Index() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Real Estate Purchase / Investment Calculator</h1>

      {/* 
        Mode selection: Future expansion for "Primary Residence" vs "Investment".
        We won't do anything special in the calculations for now, 
        but we can store the selection for future use.
      */}
      <label>
        Select Mode:{" "}
        <select name="mode" disabled>
          <option value="investment">Investment Property</option>
          <option value="primary">Primary Residence</option>
        </select>
      </label>

      <Form method="post" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label>
          Purchase Price Listing:
          <input type="number" step="any" name="purchase_price_listing" defaultValue="500000" />
        </label>
        <label>
          GST Rate (decimal):
          <input type="number" step="any" name="gst_rate" defaultValue="0.05" />
        </label>
        <label>
          Downpayment % (decimal):
          <input type="number" step="any" name="downpayment_percent" defaultValue="0.20" />
        </label>
        <label>
          Mortgage Rate (decimal):
          <input type="number" step="any" name="mortgage_rate" defaultValue="0.05" />
        </label>
        <label>
          Amortization Years:
          <input type="number" step="1" name="amortization_years" defaultValue="25" />
        </label>
        <label>
          Development Years:
          <input type="number" step="1" name="development_years" defaultValue="2" />
        </label>
        <label>
          Rent Years:
          <input type="number" step="1" name="rent_years" defaultValue="3" />
        </label>
        <label>
          Yearly Appreciation Rate (decimal):
          <input type="number" step="any" name="yearly_appreciation_rate" defaultValue="0.03" />
        </label>
        <label>
          Inflation Rate (decimal):
          <input type="number" step="any" name="inflation_rate" defaultValue="0.02" />
        </label>
        <label>
          Marginal Tax Rate (decimal):
          <input type="number" step="any" name="marginal_tax_rate" defaultValue="0.35" />
        </label>

        <label>
          Realtor Fee Rate Threshold:
          <input type="number" step="any" name="realtor_fee_rate_threshold" defaultValue="100000" />
        </label>
        <label>
          Realtor Fee Rate Until Threshold (decimal):
          <input
            type="number"
            step="any"
            name="realtor_fee_rate_until_threshold"
            defaultValue="0.03"
          />
        </label>
        <label>
          Realtor Fee Rate Above Threshold (decimal):
          <input
            type="number"
            step="any"
            name="realtor_fee_rate_above_threshold"
            defaultValue="0.025"
          />
        </label>

        <label>
          Property Transfer Tax Rate Threshold:
          <input
            type="number"
            step="any"
            name="property_transfer_tax_rate_threshold"
            defaultValue="200000"
          />
        </label>
        <label>
          Property Transfer Tax Rate Until Threshold (decimal):
          <input
            type="number"
            step="any"
            name="property_transfer_tax_rate_until_threshold"
            defaultValue="0.01"
          />
        </label>
        <label>
          Property Transfer Tax Rate Above Threshold (decimal):
          <input
            type="number"
            step="any"
            name="property_transfer_tax_rate_above_threshold"
            defaultValue="0.02"
          />
        </label>

        <label>
          Starting Rent Per Month:
          <input type="number" step="any" name="starting_rent_per_month" defaultValue="1800" />
        </label>
        <label>
          Closing Legal/Notary Fees (purchase):
          <input type="number" step="any" name="closing_legal_notary_fees" defaultValue="1200" />
        </label>
        <label>
          Selling Legal/Notary Fees:
          <input type="number" step="any" name="selling_legal_notary_fees" defaultValue="1000" />
        </label>
        <label>
          Maintenance/Repairs Monthly:
          <input type="number" step="any" name="maintenance_repairs_monthly" defaultValue="80" />
        </label>
        <label>
          Strata Fee Monthly:
          <input type="number" step="any" name="strata_fee_monthly" defaultValue="250" />
        </label>
        <label>
          Insurance Monthly:
          <input type="number" step="any" name="insurance_monthly" defaultValue="40" />
        </label>
        <label>
          Property Tax Yearly:
          <input type="number" step="any" name="property_tax_yearly" defaultValue="2500" />
        </label>

        <button disabled={navigation.state === "submitting"}>
          {navigation.state === "submitting" ? "Calculating..." : "Calculate"}
        </button>
      </Form>

      {data && (
        <div style={{ marginTop: 20 }}>
          <h2>Results</h2>
          <p>=== REAL ESTATE INVESTMENT ANALYSIS ===</p>
          <p>Downpayment: ${data.downpayment.toFixed(2)}</p>
          <p>Mortgage Amount: ${data.mortgageAmount.toFixed(2)}</p>
          <p>Monthly Mortgage Payment: ${data.monthlyPayment.toFixed(2)}</p>
          <p>Mortgage Interest Total: ${data.totalInterestPaid.toFixed(2)}</p>
          <p>Total Purchase Price w/ GST: ${data.totalPurchasePriceWithGst.toFixed(2)}</p>
          <p>Selling Price (after appreciation): ${data.sellPrice.toFixed(2)}</p>
          <br />
          <p>Closing Costs (purchase): ${data.totalClosingCosts.toFixed(2)}</p>
          <p> - Property Transfer Tax: ${data.propertyTransferTax.toFixed(2)}</p>
          <p> - Legal/Notary on purchase: ${data.closingLegalNotaryFees.toFixed(2)}</p>
          <br />
          <p>Adjusted Cost Base: ${data.adjustedCostBase.toFixed(2)}</p>
          <br />
          <p>Selling Costs (total): ${data.totalSellingCosts.toFixed(2)}</p>
          <p> - Realtor Fee on sale: ${data.realtorFeeOnSale.toFixed(2)}</p>
          <p> - Legal/Notary on sale: ${data.sellingLegalNotary.toFixed(2)}</p>
          <p> - Mortgage termination (approx): ${data.varMortgageTermination.toFixed(2)}</p>
          <br />
          <p>=== OWNING COSTS DURING RENT YEARS ===</p>
          <p>One-time rent realtor fee: ${data.oneTimeRentRealtorFee.toFixed(2)}</p>
          <p>Maintenance/repairs total: ${data.maintenanceRepairsTotal.toFixed(2)}</p>
          <p>Strata fee total: ${data.strataFeeTotal.toFixed(2)}</p>
          <p>Insurance total: ${data.insuranceTotal.toFixed(2)}</p>
          <p>Mortgage interest total: ${data.totalInterestPaid.toFixed(2)}</p>
          <p>Property tax total: ${data.propertyTaxTotal.toFixed(2)}</p>
          <br />
          <p>=== RENTAL INCOME ===</p>
          <p>Gross rental income: ${data.grossRentalIncomeTotal.toFixed(2)}</p>
          <p>Net rental income: ${data.netRentalIncomeTotal.toFixed(2)}</p>
          <br />
          <p>=== CAPITAL GAIN ===</p>
          <p>Capital gain: ${data.capitalGain.toFixed(2)}</p>
          <p>Net capital gain after tax: ${data.netCapitalGainAfterTax.toFixed(2)}</p>
          <br />
          <p>=== INVESTMENT RETURNS ===</p>
          <p>Invested amount: ${data.investedAmount.toFixed(2)}</p>
          <p>Net profit (Cap. gain + Rent): ${data.netProfit.toFixed(2)}</p>
          <p>
            Inflation-adjusted net profit: $
            {data.inflationAdjustedNetProfit.toFixed(2)}
          </p>
          <p>ROI rate: {(data.roiRate * 100).toFixed(2)}%</p>
          <p>
            Infl.-adjusted ROI rate: {(data.inflationAdjustedRoiRate * 100).toFixed(2)}%
          </p>
          <p>Avg yearly ROI rate: {(data.avgYearlyRoiRate * 100).toFixed(2)}%</p>
          <p>
            Infl.-adjusted avg yearly ROI:{" "}
            {(data.inflationAdjustedAvgYearlyRoiRate * 100).toFixed(2)}%
          </p>
          <p>Mortgage principal repaid: ${data.principalPaid.toFixed(2)}</p>
          <p>Remaining Mortgage principal: ${data.remainingPrincipal.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
