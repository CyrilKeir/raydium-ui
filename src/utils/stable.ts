import BigNumber from 'bignumber.js'

const Gn = 150
const Geps = 10 ** -6

export function cK(xBase: BigNumber, yBase: BigNumber) {
  const n = new BigNumber(Gn)
  const x = new BigNumber(xBase.gt(yBase) ? xBase : yBase)
  const y = new BigNumber(xBase.lt(yBase) ? xBase : yBase)

  let max = new BigNumber(x)
  let min = new BigNumber(y)
  let mid = new BigNumber(max).plus(min).dividedBy(2)
  let left = getCurKLeft(mid, y)
  let right = getCurKRight(n, x, y, mid)
  let count = 0

  while (left.minus(right).abs().gt(Geps)) {
    if (left.gt(right)) {
      max = mid
    } else {
      min = mid
    }
    mid = new BigNumber(max).plus(min).dividedBy(2)
    left = getCurKLeft(mid, y)
    right = getCurKRight(n, x, y, mid)
    if (count++ > 1000) break
  }

  return mid.multipliedBy(mid)
}

function getCurKLeft(mid: BigNumber, y: BigNumber) {
  return new BigNumber(mid).multipliedBy(mid).dividedBy(y).dividedBy(y)
}
function getCurKRight(n: BigNumber, x: BigNumber, y: BigNumber, mid: BigNumber) {
  const data = new BigNumber(n)
    .minus(1)
    .multipliedBy(new BigNumber(y).minus(mid))
    .multipliedBy(new BigNumber(y).minus(mid))
    .dividedBy(new BigNumber(x).minus(mid))
    .dividedBy(new BigNumber(x).minus(mid))
  return new BigNumber(n).minus(data)
}

export function getStablePrice(k: number, x: number, y: number, baseIn: boolean) {
  let price
  if (x <= y) {
    price = Math.sqrt((Gn * x ** 2 - k) / ((Gn - 1) * x ** 2))
  } else {
    price = Math.sqrt(((Gn - 1) * y ** 2) / (Gn * y ** 2 - k))
  }
  if (baseIn) {
    return price
  } else {
    return 1 / price
  }
}

function cD(k: number, dx: number, x: number, y: number, flag: boolean) {
  let maxFlag = x > y ? x : y
  maxFlag = maxFlag > dx ? maxFlag : dx

  let min = -maxFlag
  if (flag) {
    const temp = Math.sqrt(k / Gn) - y
    min = min > temp ? min : temp
  }
  let max = maxFlag
  let mid = (min + max) / 2

  const left = dx
  let rightLeft = 0
  let rightMid = 0
  let rightRight = 0

  let tempEps = Geps + 1

  let count = 0
  while (tempEps > Geps && min !== max) {
    count++
    mid = (min + max) / 2
    let temp = Gn - k / (flag ? y + min : y) ** 2
    temp = temp > 0 ? temp : 0
    rightLeft = -min * Math.sqrt((Gn - 1) / temp)
    rightMid = -mid * Math.sqrt((Gn - 1) / (Gn - k / (flag ? y + mid : y) ** 2))
    rightRight = -max * Math.sqrt((Gn - 1) / (Gn - k / (flag ? y + max : y) ** 2))

    if ((rightLeft < left && left < rightMid) || (rightLeft > left && left > rightMid)) {
      max = mid
    } else if ((rightMid < left && left < rightRight) || (rightMid > left && left > rightRight)) {
      min = mid
    }
    if (Math.abs(Math.abs(left) - Math.abs(rightMid)) === tempEps) {
      console.log('last while -> ', count)
      break
    }
    tempEps = Math.abs(Math.abs(left) - Math.abs(rightMid))
  }
  return mid
}

function getDxByDy(k: number, x: number, y: number, dy: number): number {
  if (x < y) {
    return getDyByDx(k, y, x, dy)
  }
  const y0 = Math.sqrt(k)
  if (dy <= 0) {
    if (-dy > y) return 0 // error
    const dx = -dy * Math.sqrt((Gn - 1) / (Gn - k / (y + dy) ** 2))
    return dx
  } else if (y + dy <= y0) {
    y = y + dy
    dy = -dy
    let dx = -dy * Math.sqrt((Gn - 1) / (Gn - k / (y + dy) ** 2))
    dx = -dx
    return dx
  } else {
    const dx1 = y0 - x
    const dy2 = dy - (y0 - y)
    const dx2 = getDyByDx(k, y0, y0, dy2)
    return dx1 + dx2
  }
}

function getDyByDx(k: number, x: number, y: number, dx: number): number {
  if (x < y) {
    return getDxByDy(k, y, x, dx)
  }
  const y0 = Math.sqrt(k)
  if (dx >= 0) {
    const dy = cD(k, dx, x, y, true)
    return dy
  } else if (x + dx >= y0) {
    x = x + dx
    dx = -dx
    const dy = -cD(k, dx, x, y, false)
    return dy
  } else {
    const dy1 = y0 - y
    const dx2 = dx - (y0 - x)
    const dy2 = getDxByDy(k, y0, y0, dx2)
    return dy1 + dy2
  }
}

export function getDxByDyOut(k: number, x: number, y: number, dy: number): number {
  const itemMax = y / 1000
  let totalOut = 0
  while (dy > 0) {
    const itemDy = dy < itemMax ? dy : itemMax
    const dx1 = getDxByDy(k, x, y, itemDy)

    dy -= itemDy
    x += dx1
    y += itemDy
    totalOut += dx1
  }
  return totalOut
}

export function getDyByDxOut(k: number, x: number, y: number, dx: number): number {
  const itemMax = x / 1000
  let totalOut = 0
  while (dx > 0) {
    const itemDx = dx < itemMax ? dx : itemMax
    const dy1 = getDyByDx(k, x, y, itemDx)

    dx -= itemDx
    x += itemDx
    y += dy1
    totalOut += dy1
  }
  return totalOut
}
