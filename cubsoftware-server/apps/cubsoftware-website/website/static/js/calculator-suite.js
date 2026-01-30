// Calculator Suite JavaScript

class CalculatorSuite {
    constructor() {
        this.currentCalculator = 'basic';
        this.basicDisplay = '0';
        this.basicHistory = '';
        this.sciDisplay = '0';
        this.sciHistory = '';
        this.sciMode = 'deg';
        this.currentPercentCalc = 'basic';

        this.initElements();
        this.bindEvents();
        this.initKeyboard();
        this.setDefaultDates();
        this.calculateTip();
        this.calculatePercentage();
    }

    initElements() {
        // Tab elements
        this.calcTabs = document.querySelectorAll('.calc-tab');
        this.calcPanels = document.querySelectorAll('.calc-panel');

        // Basic calculator elements
        this.basicDisplayEl = document.getElementById('basicDisplay');
        this.basicHistoryEl = document.getElementById('basicHistory');

        // Scientific calculator elements
        this.sciDisplayEl = document.getElementById('sciDisplay');
        this.sciHistoryEl = document.getElementById('sciHistory');
        this.sciModeBtns = document.querySelectorAll('.mode-btn');

        // Mortgage elements
        this.homePrice = document.getElementById('homePrice');
        this.downPayment = document.getElementById('downPayment');
        this.interestRate = document.getElementById('interestRate');
        this.loanTerm = document.getElementById('loanTerm');

        // Tip elements
        this.billAmount = document.getElementById('billAmount');
        this.tipPresets = document.querySelectorAll('.tip-preset');
        this.customTip = document.getElementById('customTip');
        this.splitCount = document.getElementById('splitCount');

        // BMI elements
        this.unitBtns = document.querySelectorAll('.unit-btn');

        // Age elements
        this.birthDate = document.getElementById('birthDate');
        this.targetDate = document.getElementById('targetDate');

        // Percentage elements
        this.percentTabs = document.querySelectorAll('.percent-tab');
        this.percentPanels = document.querySelectorAll('.percent-panel');

        // Toast
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        // Tab switching
        this.calcTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchCalculator(tab.dataset.calculator));
        });

        // Basic calculator buttons
        document.querySelectorAll('#basic-panel .calc-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleBasicButton(btn));
        });

        // Scientific calculator buttons
        document.querySelectorAll('#scientific-panel .calc-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleScientificButton(btn));
        });

        // Scientific mode toggle
        this.sciModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sciModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.sciMode = btn.dataset.mode;
            });
        });

        // Mortgage calculator
        document.getElementById('calculateMortgage').addEventListener('click', () => this.calculateMortgage());
        [this.homePrice, this.downPayment].forEach(el => {
            el.addEventListener('input', () => this.updateDownPaymentPercent());
        });
        document.getElementById('toggleAmortization').addEventListener('click', (e) => {
            const table = document.getElementById('amortizationTable');
            const btn = e.currentTarget;
            table.classList.toggle('show');
            btn.classList.toggle('active');
            btn.textContent = table.classList.contains('show') ? 'Hide Amortization Schedule' : 'Show Amortization Schedule';
        });

        // Tip calculator
        this.billAmount.addEventListener('input', () => this.calculateTip());
        this.tipPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tipPresets.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.customTip.value = '';
                this.calculateTip();
            });
        });
        this.customTip.addEventListener('input', () => {
            this.tipPresets.forEach(b => b.classList.remove('active'));
            this.calculateTip();
        });
        this.splitCount.addEventListener('input', () => this.calculateTip());
        document.getElementById('splitMinus').addEventListener('click', () => {
            const current = parseInt(this.splitCount.value) || 1;
            if (current > 1) {
                this.splitCount.value = current - 1;
                this.calculateTip();
            }
        });
        document.getElementById('splitPlus').addEventListener('click', () => {
            const current = parseInt(this.splitCount.value) || 1;
            if (current < 50) {
                this.splitCount.value = current + 1;
                this.calculateTip();
            }
        });

        // BMI calculator
        this.unitBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchBMIUnit(btn.dataset.unit));
        });
        document.getElementById('calculateBMI').addEventListener('click', () => this.calculateBMI());

        // Age calculator
        document.getElementById('calculateAge').addEventListener('click', () => this.calculateAge());

        // Percentage calculator tabs
        this.percentTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchPercentCalc(tab.dataset.calc));
        });

        // Percentage calculator inputs
        document.querySelectorAll('.percentage-calculator input, .percentage-calculator select').forEach(el => {
            el.addEventListener('input', () => this.calculatePercentage());
        });
    }

    initKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.currentCalculator === 'basic' || this.currentCalculator === 'scientific') {
                // Don't capture if user is typing in an input field
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
                this.handleKeyboardInput(e);
            }
        });
    }

    handleKeyboardInput(e) {
        const key = e.key;
        const isBasic = this.currentCalculator === 'basic';

        // Numbers
        if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            this.inputNumber(key, isBasic);
        }
        // Operators
        else if (key === '+') { e.preventDefault(); this.inputOperator('+', isBasic); }
        else if (key === '-') { e.preventDefault(); this.inputOperator('-', isBasic); }
        else if (key === '*') { e.preventDefault(); this.inputOperator('*', isBasic); }
        else if (key === '/') { e.preventDefault(); this.inputOperator('/', isBasic); }
        // Decimal
        else if (key === '.') { e.preventDefault(); this.inputDecimal(isBasic); }
        // Enter/Equals
        else if (key === 'Enter' || key === '=') { e.preventDefault(); this.calculate(isBasic); }
        // Backspace
        else if (key === 'Backspace') { e.preventDefault(); this.backspace(isBasic); }
        // Escape/Clear
        else if (key === 'Escape') { e.preventDefault(); this.clear(isBasic); }
        // Parentheses (scientific)
        else if (key === '(' && !isBasic) { e.preventDefault(); this.inputParen('('); }
        else if (key === ')' && !isBasic) { e.preventDefault(); this.inputParen(')'); }
    }

    // === Tab Switching ===
    switchCalculator(calculator) {
        this.currentCalculator = calculator;
        this.calcTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.calculator === calculator);
        });
        this.calcPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${calculator}-panel`);
        });
    }

    // === Basic Calculator Methods ===
    handleBasicButton(btn) {
        const value = btn.dataset.value;
        const action = btn.dataset.action;

        if (value) {
            this.inputNumber(value, true);
        } else if (action) {
            switch (action) {
                case 'clear': this.clear(true); break;
                case 'backspace': this.backspace(true); break;
                case 'percent': this.calculatePercent(true); break;
                case 'divide': this.inputOperator('/', true); break;
                case 'multiply': this.inputOperator('*', true); break;
                case 'subtract': this.inputOperator('-', true); break;
                case 'add': this.inputOperator('+', true); break;
                case 'decimal': this.inputDecimal(true); break;
                case 'equals': this.calculate(true); break;
            }
        }
    }

    inputNumber(num, isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        if (this[displayKey] === '0' || this[displayKey] === 'Error') {
            this[displayKey] = num;
        } else {
            this[displayKey] += num;
        }
        this.updateDisplay(isBasic);
    }

    inputOperator(op, isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        const lastChar = this[displayKey].slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
            this[displayKey] = this[displayKey].slice(0, -1) + op;
        } else {
            this[displayKey] += op;
        }
        this.updateDisplay(isBasic);
    }

    inputDecimal(isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        const parts = this[displayKey].split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (!lastPart.includes('.')) {
            this[displayKey] += '.';
        }
        this.updateDisplay(isBasic);
    }

    clear(isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        const historyKey = isBasic ? 'basicHistory' : 'sciHistory';
        this[displayKey] = '0';
        this[historyKey] = '';
        this.updateDisplay(isBasic);
    }

    backspace(isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        if (this[displayKey].length > 1 && this[displayKey] !== 'Error') {
            this[displayKey] = this[displayKey].slice(0, -1);
        } else {
            this[displayKey] = '0';
        }
        this.updateDisplay(isBasic);
    }

    calculatePercent(isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        try {
            const value = this.safeEval(this[displayKey]);
            this[displayKey] = String(value / 100);
        } catch (e) {
            this[displayKey] = 'Error';
        }
        this.updateDisplay(isBasic);
    }

    calculate(isBasic) {
        const displayKey = isBasic ? 'basicDisplay' : 'sciDisplay';
        const historyKey = isBasic ? 'basicHistory' : 'sciHistory';
        try {
            const expression = this[displayKey];
            const result = this.safeEval(expression);
            if (result === undefined || isNaN(result) || !isFinite(result)) {
                this[displayKey] = 'Error';
            } else {
                this[historyKey] = expression + ' =';
                this[displayKey] = String(this.formatResult(result));
            }
        } catch (e) {
            this[displayKey] = 'Error';
        }
        this.updateDisplay(isBasic);
    }

    safeEval(expression) {
        // Only allow numbers, operators, parentheses, and decimal points
        if (!/^[\d\+\-\*\/\.\(\)\s]+$/.test(expression)) {
            throw new Error('Invalid expression');
        }
        return Function('"use strict"; return (' + expression + ')')();
    }

    updateDisplay(isBasic) {
        if (isBasic) {
            this.basicDisplayEl.value = this.basicDisplay;
            this.basicHistoryEl.textContent = this.basicHistory;
        } else {
            this.sciDisplayEl.value = this.sciDisplay;
            this.sciHistoryEl.textContent = this.sciHistory;
        }
    }

    formatResult(num) {
        if (Number.isInteger(num)) return num;
        // Limit to reasonable precision
        const formatted = parseFloat(num.toPrecision(10));
        return formatted;
    }

    // === Scientific Calculator Methods ===
    handleScientificButton(btn) {
        const value = btn.dataset.value;
        const action = btn.dataset.action;

        if (value) {
            this.inputNumber(value, false);
        } else if (action) {
            switch (action) {
                // Standard operations
                case 'clear': this.clear(false); break;
                case 'backspace': this.backspace(false); break;
                case 'percent': this.calculatePercent(false); break;
                case 'divide': this.inputOperator('/', false); break;
                case 'multiply': this.inputOperator('*', false); break;
                case 'subtract': this.inputOperator('-', false); break;
                case 'add': this.inputOperator('+', false); break;
                case 'decimal': this.inputDecimal(false); break;
                case 'equals': this.calculate(false); break;

                // Scientific functions
                case 'sin': this.applyTrigFunction('sin'); break;
                case 'cos': this.applyTrigFunction('cos'); break;
                case 'tan': this.applyTrigFunction('tan'); break;
                case 'log': this.applyFunction('log10'); break;
                case 'ln': this.applyFunction('log'); break;
                case 'sqrt': this.applyFunction('sqrt'); break;
                case 'square': this.applyPower(2); break;
                case 'power': this.sciDisplay += '**'; this.updateDisplay(false); break;
                case 'pi': this.insertConstant(Math.PI); break;
                case 'e': this.insertConstant(Math.E); break;
                case 'openParen': this.inputParen('('); break;
                case 'closeParen': this.inputParen(')'); break;
                case 'factorial': this.calculateFactorial(); break;
                case 'abs': this.applyFunction('abs'); break;
                case 'inverse': this.applyInverse(); break;
            }
        }
    }

    applyTrigFunction(func) {
        try {
            let value = this.safeEval(this.sciDisplay);
            if (this.sciMode === 'deg') {
                value = value * (Math.PI / 180);
            }
            const result = Math[func](value);
            this.sciHistory = `${func}(${this.sciDisplay})`;
            this.sciDisplay = String(this.formatResult(result));
        } catch (e) {
            this.sciDisplay = 'Error';
        }
        this.updateDisplay(false);
    }

    applyFunction(func) {
        try {
            const value = this.safeEval(this.sciDisplay);
            const result = Math[func](value);
            if (isNaN(result) || !isFinite(result)) {
                this.sciDisplay = 'Error';
            } else {
                this.sciHistory = `${func}(${this.sciDisplay})`;
                this.sciDisplay = String(this.formatResult(result));
            }
        } catch (e) {
            this.sciDisplay = 'Error';
        }
        this.updateDisplay(false);
    }

    applyPower(power) {
        try {
            const value = this.safeEval(this.sciDisplay);
            const result = Math.pow(value, power);
            this.sciHistory = `${this.sciDisplay}^${power}`;
            this.sciDisplay = String(this.formatResult(result));
        } catch (e) {
            this.sciDisplay = 'Error';
        }
        this.updateDisplay(false);
    }

    insertConstant(value) {
        if (this.sciDisplay === '0') {
            this.sciDisplay = String(this.formatResult(value));
        } else {
            const lastChar = this.sciDisplay.slice(-1);
            if (/[\d\)]/.test(lastChar)) {
                this.sciDisplay += '*' + this.formatResult(value);
            } else {
                this.sciDisplay += this.formatResult(value);
            }
        }
        this.updateDisplay(false);
    }

    inputParen(paren) {
        if (this.sciDisplay === '0' && paren === '(') {
            this.sciDisplay = paren;
        } else {
            this.sciDisplay += paren;
        }
        this.updateDisplay(false);
    }

    calculateFactorial() {
        try {
            const n = parseInt(this.safeEval(this.sciDisplay));
            if (n < 0 || n > 170) {
                this.sciDisplay = 'Error';
            } else {
                let result = 1;
                for (let i = 2; i <= n; i++) result *= i;
                this.sciHistory = `${n}!`;
                this.sciDisplay = String(result);
            }
        } catch (e) {
            this.sciDisplay = 'Error';
        }
        this.updateDisplay(false);
    }

    applyInverse() {
        try {
            const value = this.safeEval(this.sciDisplay);
            if (value === 0) {
                this.sciDisplay = 'Error';
            } else {
                this.sciHistory = `1/${this.sciDisplay}`;
                this.sciDisplay = String(this.formatResult(1 / value));
            }
        } catch (e) {
            this.sciDisplay = 'Error';
        }
        this.updateDisplay(false);
    }

    // === Mortgage Calculator ===
    calculateMortgage() {
        const homePrice = parseFloat(this.homePrice.value) || 0;
        const downPaymentVal = parseFloat(this.downPayment.value) || 0;
        const P = homePrice - downPaymentVal;
        const annualRate = parseFloat(this.interestRate.value) || 0;
        const r = annualRate / 100 / 12;
        const years = parseInt(this.loanTerm.value) || 30;
        const n = years * 12;

        if (P <= 0) {
            this.showToast('Loan amount must be greater than 0', true);
            return;
        }
        if (r <= 0) {
            this.showToast('Interest rate must be greater than 0', true);
            return;
        }

        // Monthly payment formula: M = P[r(1+r)^n]/[(1+r)^n-1]
        const monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = monthly * n;
        const totalInterest = totalPayment - P;

        document.getElementById('loanAmount').textContent = this.formatCurrency(P);
        document.getElementById('monthlyPayment').textContent = this.formatCurrency(monthly);
        document.getElementById('totalInterest').textContent = this.formatCurrency(totalInterest);
        document.getElementById('totalPayment').textContent = this.formatCurrency(totalPayment);

        this.generateAmortization(P, r, n, monthly);
    }

    generateAmortization(principal, monthlyRate, totalMonths, monthlyPayment) {
        const tbody = document.getElementById('amortizationBody');
        tbody.innerHTML = '';

        let balance = principal;
        let yearPrincipal = 0;
        let yearInterest = 0;

        for (let month = 1; month <= totalMonths; month++) {
            const interest = balance * monthlyRate;
            const principalPaid = monthlyPayment - interest;
            balance -= principalPaid;

            yearPrincipal += principalPaid;
            yearInterest += interest;

            if (month % 12 === 0 || month === totalMonths) {
                const year = Math.ceil(month / 12);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${year}</td>
                    <td>${this.formatCurrency(yearPrincipal)}</td>
                    <td>${this.formatCurrency(yearInterest)}</td>
                    <td>${this.formatCurrency(Math.max(0, balance))}</td>
                `;
                tbody.appendChild(row);
                yearPrincipal = 0;
                yearInterest = 0;
            }
        }
    }

    updateDownPaymentPercent() {
        const home = parseFloat(this.homePrice.value) || 0;
        const down = parseFloat(this.downPayment.value) || 0;
        const percent = home > 0 ? (down / home * 100).toFixed(1) : 0;
        document.getElementById('downPaymentPercent').textContent = `${percent}% of home price`;
    }

    // === Tip Calculator ===
    calculateTip() {
        const bill = parseFloat(this.billAmount.value) || 0;
        let tipPercent = parseFloat(this.customTip.value);

        if (!tipPercent && tipPercent !== 0) {
            const activePreset = document.querySelector('.tip-preset.active');
            tipPercent = activePreset ? parseFloat(activePreset.dataset.tip) : 18;
        }

        const tipAmount = bill * (tipPercent / 100);
        const total = bill + tipAmount;
        const split = parseInt(this.splitCount.value) || 1;
        const perPerson = total / split;

        document.getElementById('tipAmount').textContent = this.formatCurrency(tipAmount);
        document.getElementById('tipTotal').textContent = this.formatCurrency(total);
        document.getElementById('perPerson').textContent = this.formatCurrency(perPerson);

        document.getElementById('splitSection').style.display = split > 1 ? 'block' : 'none';
    }

    // === BMI Calculator ===
    switchBMIUnit(unit) {
        this.unitBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        document.getElementById('imperialInputs').style.display = unit === 'imperial' ? 'block' : 'none';
        document.getElementById('metricInputs').style.display = unit === 'metric' ? 'block' : 'none';
    }

    calculateBMI() {
        let heightM, weightKg;
        const isImperial = document.querySelector('.unit-btn.active').dataset.unit === 'imperial';

        if (isImperial) {
            const feet = parseFloat(document.getElementById('heightFeet').value) || 0;
            const inches = parseFloat(document.getElementById('heightInches').value) || 0;
            const lbs = parseFloat(document.getElementById('weightLbs').value) || 0;

            heightM = (feet * 12 + inches) * 0.0254;
            weightKg = lbs * 0.453592;
        } else {
            heightM = (parseFloat(document.getElementById('heightCm').value) || 0) / 100;
            weightKg = parseFloat(document.getElementById('weightKg').value) || 0;
        }

        if (heightM <= 0 || weightKg <= 0) {
            this.showToast('Please enter valid measurements', true);
            return;
        }

        const bmi = weightKg / (heightM * heightM);
        const category = this.getBMICategory(bmi);

        document.getElementById('bmiValue').textContent = bmi.toFixed(1);
        const bmiCategoryEl = document.getElementById('bmiCategory');
        bmiCategoryEl.textContent = category.text;
        bmiCategoryEl.className = `bmi-category ${category.class}`;

        // Position indicator (BMI scale 15-40)
        const position = Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100);
        const indicator = document.getElementById('bmiIndicator');
        indicator.style.left = `calc(${position}% - 2px)`;
        indicator.classList.add('show');
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) return { text: 'Underweight', class: 'underweight' };
        if (bmi < 25) return { text: 'Normal Weight', class: 'normal' };
        if (bmi < 30) return { text: 'Overweight', class: 'overweight' };
        return { text: 'Obese', class: 'obese' };
    }

    // === Age Calculator ===
    setDefaultDates() {
        const today = new Date();
        this.targetDate.valueAsDate = today;
        const defaultBirth = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
        this.birthDate.valueAsDate = defaultBirth;
    }

    calculateAge() {
        const birth = new Date(this.birthDate.value);
        const target = new Date(this.targetDate.value);

        if (isNaN(birth.getTime())) {
            this.showToast('Please enter a valid birth date', true);
            return;
        }

        if (birth > target) {
            this.showToast('Birth date cannot be in the future', true);
            return;
        }

        // Calculate years, months, days
        let years = target.getFullYear() - birth.getFullYear();
        let months = target.getMonth() - birth.getMonth();
        let days = target.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Total calculations
        const totalDays = Math.floor((target - birth) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = years * 12 + months;
        const totalHours = totalDays * 24;

        document.getElementById('ageYears').textContent = years;
        document.getElementById('ageMonths').textContent = months;
        document.getElementById('ageDays').textContent = days;
        document.getElementById('totalMonths').textContent = totalMonths.toLocaleString();
        document.getElementById('totalWeeks').textContent = totalWeeks.toLocaleString();
        document.getElementById('totalDays').textContent = totalDays.toLocaleString();
        document.getElementById('totalHours').textContent = totalHours.toLocaleString();

        // Next birthday
        let nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthday <= target) {
            nextBirthday.setFullYear(target.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((nextBirthday - target) / (1000 * 60 * 60 * 24));

        document.getElementById('nextBirthday').textContent = nextBirthday.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('daysUntilBirthday').textContent = daysUntil;
    }

    // === Percentage Calculator ===
    switchPercentCalc(calc) {
        this.currentPercentCalc = calc;
        this.percentTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.calc === calc);
        });
        this.percentPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${calc}-percent`);
        });
    }

    calculatePercentage() {
        // Basic: X% of Y
        const percentOf = parseFloat(document.getElementById('percentOf').value) || 0;
        const percentOfNumber = parseFloat(document.getElementById('percentOfNumber').value) || 0;
        document.getElementById('percentOfResult').textContent =
            this.formatNumber(percentOfNumber * percentOf / 100);

        // What percent is X of Y?
        const whatNum = parseFloat(document.getElementById('whatPercentNum').value) || 0;
        const whatOf = parseFloat(document.getElementById('whatPercentOf').value) || 1;
        document.getElementById('whatPercentResult').textContent =
            this.formatNumber(whatNum / whatOf * 100) + '%';

        // Percentage change
        const changeFrom = parseFloat(document.getElementById('changeFrom').value) || 0;
        const changeTo = parseFloat(document.getElementById('changeTo').value) || 0;
        let changePercent = 0;
        if (changeFrom !== 0) {
            changePercent = ((changeTo - changeFrom) / Math.abs(changeFrom)) * 100;
        }
        const changeSign = changePercent >= 0 ? '+' : '';
        document.getElementById('changeResult').textContent =
            changeSign + this.formatNumber(changePercent) + '%';

        // Increase/Decrease
        const increaseNum = parseFloat(document.getElementById('increaseNum').value) || 0;
        const increasePercent = parseFloat(document.getElementById('increasePercent').value) || 0;
        const increaseType = document.getElementById('increaseType').value;
        const multiplier = increaseType === 'increase' ? (1 + increasePercent / 100) : (1 - increasePercent / 100);
        document.getElementById('increaseResult').textContent =
            this.formatNumber(increaseNum * multiplier);
    }

    // === Utility Methods ===
    formatCurrency(num) {
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    formatNumber(num) {
        if (Math.abs(num) >= 1000000) {
            return num.toExponential(2);
        }
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    showToast(message, isError = false) {
        this.toast.textContent = message;
        this.toast.classList.toggle('error', isError);
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new CalculatorSuite();
});
