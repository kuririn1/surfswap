export class LiqudityError extends Error {
    constructor(leftToFill, message = 'Not enough liquidity') {
      super(message);
      this.leftToFill = leftToFill;
      this.name = "LiqudityError";
    }
  }