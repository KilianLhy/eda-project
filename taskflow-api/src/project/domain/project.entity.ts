export class Project {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly memberIds: string[] = [],
  ) {}

  addMember(memberId: string): void {
    if (!this.memberIds.includes(memberId)) {
      this.memberIds.push(memberId);
    }
  }
}
