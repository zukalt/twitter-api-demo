export interface Tweet {
  _id: string | any,
  text: string,
  createdAt: number,
}

export interface TweetsRangeStats {
  maxId: string
  maxTime: number
  minId: string
  minTime: number
}
