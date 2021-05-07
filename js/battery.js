const GRN = "#66e86e";
const YLW = "#e3e866";
const RED = "#e86666";

function clamp(x, lo, hi) {
    return x < hi ? (x > lo ? x : lo) : hi;
}

export class Battery {
    constructor() {
        this.level = 1.0;
        this.targetLevel = 1.0;

        this.border = document.createElement("div");
        this.border.setAttribute('class', 'health-border');
        document.body.appendChild(this.border);

        this.bar = document.createElement("div");
        this.bar.setAttribute('class', 'health-bar');
        this.bar.style.width = "250px";
        this.border.appendChild(this.bar);

        this.valueText = document.createElement("p");
        this.valueText.setAttribute('class', 'health-value');
        this.bar.appendChild(this.valueText);
    }

    update(deltaTarget) {
        let newTarget = this.target + deltaTarget;
        this.target = clamp(newTarget, 0, 1);
        const delta = 0.05 * (this.target - this.level);

        if (Math.abs(delta) < 0.005) {
            this.level = this.target;
        } else {
            this.level += delta;
        }

        this.bar.style.width = this.level * 250 + "px";
        this.valueText.innerHTML = Math.floor(this.level * 100) + "%"

        if (this.level > 0.8) {
            this.bar.style['background-color'] = GRN;
        } else if (this.level > 0.3) {
            this.bar.style['background-color'] = YLW;
        } else {
            this.bar.style['background-color'] = RED;
        }
        // console.log(this.level)
    }
}