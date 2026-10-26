/* -------------------- 1. UTILITIES -------------------- */

const $ = (selector) => document.querySelector(selector);

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);

function badge(value) {
    const label = String(value ?? "-");
    const className = label.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    return `
        <span class="badge ${className}">
            ${escapeHTML(label)}
        </span>
    `;
}

function showError(error) {
    console.error("Dashboard error:", error);

    let errorBox = $("#errorMessage");

    if (!errorBox) {
        errorBox = document.createElement("div");
        errorBox.id = "errorMessage";
        errorBox.setAttribute("role", "alert");
        document.body.prepend(errorBox);
    }

    errorBox.textContent =
        error.message || "Something went wrong. Please try again.";
}

function clearError() {
    const errorBox = $("#errorMessage");

    if (errorBox) {
        errorBox.remove();
    }
}


/* -------------------- 2. API SERVICE -------------------- */

async function api(url, options = {}) {
    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            response.ok
                ? "The server returned an invalid response."
                : `Request failed with status ${response.status}.`
        );
    }

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}


/* -------------------- 3. DASHBOARD SUMMARY -------------------- */

async function loadDashboardSummary() {
    const summary = await api("/api/summary");

    const cards = [
        {
            label: "Transactions",
            value: Number(summary.total_transactions || 0)
                .toLocaleString("en-IN"),
        },
        {
            label: "Transaction Value",
            value: money(summary.total_value),
        },
        {
            label: "Potential Exceptions",
            value: Number(summary.potential_exceptions || 0)
                .toLocaleString("en-IN"),
        },
        {
            label: "High Risk",
            value: Number(summary.high_risk_transactions || 0)
                .toLocaleString("en-IN"),
        },
        {
            label: "Average Transaction",
            value: money(summary.average_transaction),
        },
    ];

    $("#cards").innerHTML = cards
        .map((card) => `
            <div class="card">
                <span>${escapeHTML(card.label)}</span>
                <b>${escapeHTML(card.value)}</b>
            </div>
        `)
        .join("");
}


/* -------------------- 4. EXCEPTION CHART -------------------- */

function renderExceptionsChart(types) {
    const container = $("#exceptionsChart");

    if (!types.length) {
        container.textContent = "No exception data available.";
        return;
    }

    const maxCount = Math.max(
        ...types.map((item) => Number(item.count || 0)),
        1
    );

    container.innerHTML = types
        .map((item) => {
            const count = Number(item.count || 0);
            const width = (count / maxCount) * 100;

            return `
                <div class="bar">
                    <span>${escapeHTML(item.name)}</span>

                    <div class="track">
                        <div
                            class="fill"
                            style="width: ${width}%"
                        ></div>
                    </div>

                    <b>${count}</b>
                </div>
            `;
        })
        .join("");
}


/* -------------------- 5. RISK CHART -------------------- */

function renderRiskChart(riskData) {
    const container = $("#riskChart");

    if (!riskData.length) {
        container.textContent = "No risk data available.";
        return;
    }

    container.innerHTML = `
        <div class="risk">
            ${riskData.map((item) => `
                <div class="riskbox">
                    <b>${Number(item.count || 0)}</b>
                    <br>
                    ${badge(item.name)}
                </div>
            `).join("")}
        </div>
    `;
}


/* -------------------- 6. MONTHLY TRANSACTION CHART -------------------- */

function renderMonthlyChart(monthlyData) {
    const container = $("#monthlyChart");

    if (!monthlyData.length) {
        container.textContent = "No monthly data available.";
        return;
    }

    const maxValue = Math.max(
        ...monthlyData.map((item) => Number(item.total_value || 0)),
        1
    );

    container.innerHTML = monthlyData
        .map((item) => {
            const value = Number(item.total_value || 0);
            const height = Math.max((value / maxValue) * 180, 3);

            return `
                <div
                    class="monthcol"
                    title="${escapeHTML(item.month)}: ${escapeHTML(money(value))}"
                >
                    <div
                        class="monthbar"
                        style="height: ${height}px"
                    ></div>
                </div>
            `;
        })
        .join("");
}


/* -------------------- 7. LOAD ALL DASHBOARD CHARTS -------------------- */

async function loadDashboard() {
    const [exceptions, monthly] = await Promise.all([
        api("/api/exceptions"),
        api("/api/monthly"),
        loadDashboardSummary(),
    ]);

    renderExceptionsChart(exceptions.types || []);
    renderRiskChart(exceptions.risk || []);
    renderMonthlyChart(monthly || []);
}


/* -------------------- 8. DEPARTMENT DROPDOWNS -------------------- */

async function loadDepartments() {
    const departments = await api("/api/departments");

    const dropdowns = ["#edept", "#tdept"];

    dropdowns.forEach((selector) => {
        const dropdown = $(selector);

        if (!dropdown) return;

        // Keep the existing placeholder and avoid duplicate options.
        const existingValues = new Set(
            Array.from(dropdown.options).map((option) => option.value)
        );

        departments.forEach((department) => {
            if (existingValues.has(String(department))) return;

            const option = document.createElement("option");
            option.value = department;
            option.textContent = department;

            dropdown.appendChild(option);
        });
    });
}


/* -------------------- 9. TRANSACTION TABLE ROW -------------------- */

function createTransactionRow(transaction, isException = false) {
    const columns = isException
        ? `
            <td>${escapeHTML(transaction.Vendor_Name)}</td>
            <td>${escapeHTML(money(transaction.Amount))}</td>
            <td>${escapeHTML(transaction.Exception_Type)}</td>
        `
        : `
            <td>${escapeHTML(transaction.Transaction_Date)}</td>
            <td>${escapeHTML(transaction.Vendor_Name)}</td>
            <td>${escapeHTML(transaction.Department)}</td>
            <td>${escapeHTML(money(transaction.Amount))}</td>
        `;

    return `
        <tr>
            <td>${escapeHTML(transaction.Transaction_ID)}</td>
            ${columns}
            <td>${badge(transaction.Risk_Level)}</td>
            <td>${Number(transaction.Risk_Score || 0).toFixed(0)}</td>
            <td>
                <button
                    class="view"
                    type="button"
                    data-transaction-id="${escapeHTML(transaction.Transaction_ID)}"
                >
                    View
                </button>
            </td>
        </tr>
    `;
}


/* -------------------- 10. LOAD AND FILTER TRANSACTIONS -------------------- */

async function loadTransactionTable(
    targetSelector,
    filters = {},
    isException = false
) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    const transactions = await api(
        `/api/transactions?${query.toString()}`
    );

    $(targetSelector).innerHTML = transactions
        .map((transaction) =>
            createTransactionRow(transaction, isException)
        )
        .join("");
}


/* -------------------- 11. TRANSACTION DETAILS MODAL -------------------- */

async function openTransaction(transactionId) {
    const transaction = await api(
        `/api/transactions/${encodeURIComponent(transactionId)}`
    );

    $("#mtitle").textContent = transaction.Transaction_ID;

    $("#mbody").innerHTML = Object.entries(transaction)
        .map(([key, value]) => {
            const formattedValue =
                key === "Amount" ? money(value) : value ?? "-";

            return `
                <div class="detail">
                    <small>
                        ${escapeHTML(key.replaceAll("_", " "))}
                    </small>
                    <b>${escapeHTML(formattedValue)}</b>
                </div>
            `;
        })
        .join("");

    $("#modal").classList.remove("hidden");
}

function closeModal() {
    $("#modal").classList.add("hidden");
}


/* -------------------- 12. NAVIGATION -------------------- */

function initializeNavigation() {
    document.querySelectorAll("nav button").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll("nav button").forEach((item) => {
                item.classList.remove("active");
            });

            document.querySelectorAll(".page").forEach((page) => {
                page.classList.remove("active");
            });

            button.classList.add("active");

            const page = $("#" + button.dataset.page);

            if (page) {
                page.classList.add("active");
            }
        });
    });
}


/* -------------------- 13. FILTER EVENTS -------------------- */

function initializeFilters() {
    $("#efilter").addEventListener("click", () => {
        loadTransactionTable(
            "#etable",
            {
                search: $("#esearch").value,
                risk: $("#erisk").value,
                department: $("#edept").value,
            },
            true
        ).catch(showError);
    });

    $("#tfilter").addEventListener("click", () => {
        loadTransactionTable(
            "#ttable",
            {
                search: $("#tsearch").value,
                risk: $("#trisk").value,
                department: $("#tdept").value,
            },
            false
        ).catch(showError);
    });
}


/* -------------------- 14. TABLE VIEW EVENTS -------------------- */

function initializeTableEvents() {
    // Event delegation handles View buttons after table re-rendering.
    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-transaction-id]");

        if (!button) return;

        openTransaction(button.dataset.transactionId)
            .catch(showError);
    });
}


/* -------------------- 15. MODAL EVENTS -------------------- */

function initializeModal() {
    $("#close").addEventListener("click", closeModal);

    $("#modal").addEventListener("click", (event) => {
        if (event.target.id === "modal") {
            closeModal();
        }
    });
}


/* -------------------- 16. VENDOR TABLE -------------------- */

async function loadVendors() {
    const vendors = await api("/api/vendors");

    $("#vtable").innerHTML = vendors
        .map((vendor) => `
            <tr>
                <td>${escapeHTML(vendor.Vendor_ID)}</td>
                <td>${escapeHTML(vendor.Vendor_Name)}</td>
                <td>${Number(vendor.Transaction_Count || 0)}</td>
                <td>${escapeHTML(money(vendor.Total_Amount))}</td>
            </tr>
        `)
        .join("");
}


/* -------------------- 17. REGENERATE TRANSACTIONS -------------------- */

async function regenerateTransactions() {
    const button = $("#regen");

    button.disabled = true;

    try {
        await api("/api/regenerate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rows: 10000,
            }),
        });

        await initializeDashboard();
    } finally {
        button.disabled = false;
    }
}


/* -------------------- 18. INITIALIZE DASHBOARD -------------------- */

async function initializeDashboard() {
    clearError();

    await Promise.all([
        loadDashboard(),
        loadDepartments(),
        loadTransactionTable("#etable", {}, true),
        loadTransactionTable("#ttable", {}, false),
        loadVendors(),
    ]);
}


/* -------------------- 19. APPLICATION STARTUP -------------------- */

function initializeEventListeners() {
    initializeNavigation();
    initializeFilters();
    initializeTableEvents();
    initializeModal();

    $("#regen").addEventListener("click", () => {
        regenerateTransactions().catch(showError);
    });
}

function startApplication() {
    initializeEventListeners();
    initializeDashboard().catch(showError);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApplication);
} else {
    startApplication();
}
