import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { CrApiService } from '../../api/cr-api.service';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentInstance.id = id;
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded state
	return fixture;
}

describe('CrDetailComponent', () => {
	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('hides review actions for a read-only viewer on a pending request', async () => {
		const fixture = await render(users.viewer, 'CR-1');

		expect(fixture.nativeElement.querySelector('.cr-actions__approve')).toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
	});

	it('hides review actions after a request is no longer pending', async () => {
		const fixture = await render(users.approver, 'CR-2');

		expect(fixture.nativeElement.querySelector('.cr-actions__approve')).toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
	});

	it('requires a reason before Reject is enabled', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const reason: HTMLTextAreaElement = fixture.nativeElement.querySelector('.cr-actions__reason');
		const rejectButton: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__reject-btn');

		expect(rejectButton.disabled).toBe(true);

		reason.dispatchEvent(new Event('blur'));
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-actions__reason-error')?.textContent).toContain('Please enter a reason.');

		reason.value = 'The requested change needs revision.';
		reason.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectButton.disabled).toBe(false);
	});

	it('approves a pending request and updates the detail screen', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const approveButton: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');

		approveButton.click();
		await flush();
		fixture.detectChanges();

		const actions = Array.from(fixture.nativeElement.querySelectorAll('.cr-timeline__action')).map((element: Element) =>
			element.textContent?.trim(),
		);

		expect(fixture.nativeElement.querySelector('.cr-status').textContent).toContain('APPROVED');
		expect(actions).toContain('APPROVE');
		expect(fixture.nativeElement.querySelector('.cr-actions__approve')).toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
	});

	it('keeps the detail visible and shows an error when Approve fails', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const api = TestBed.inject(CrApiService);
		api.failNext = true;

		const approveButton: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		approveButton.click();
		await flush();
		fixture.detectChanges();

		const retryableApproveButton: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');

		expect(fixture.nativeElement.querySelector('.cr-actions__error')?.textContent).toContain('Network error');
		expect(fixture.nativeElement.querySelector('.cr-status').textContent).toContain('PENDING_APPROVAL');
		expect(retryableApproveButton.disabled).toBe(false);
	});

	it('rejects a pending request and records the reason', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const reason: HTMLTextAreaElement = fixture.nativeElement.querySelector('.cr-actions__reason');
		const rejectButton: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__reject-btn');

		reason.value = 'The requested change needs revision.';
		reason.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		rejectButton.click();
		await flush();
		fixture.detectChanges();

		const entries = Array.from(fixture.nativeElement.querySelectorAll('.cr-timeline__entry')).map((element: Element) =>
			element.textContent?.trim(),
		);

		expect(fixture.nativeElement.querySelector('.cr-status').textContent).toContain('REJECTED');
		expect(entries.join(' ')).toContain('REJECT');
		expect(entries.join(' ')).toContain('The requested change needs revision.');
		expect(fixture.nativeElement.querySelector('.cr-actions__approve')).toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
	});

	it('renders the audit timeline oldest first', async () => {
		const fixture = await render(users.approver, 'CR-1');

		const actions = Array.from(fixture.nativeElement.querySelectorAll('.cr-timeline__action')).map((element: Element) =>
			element.textContent?.trim(),
		);

		expect(actions).toEqual(['CREATE', 'SUBMIT', 'SEND_FOR_APPROVAL']);
	});

	it('renders diff rows and formatted totals', async () => {
		const fixture = await render(users.approver, 'CR-1');

		const totals = fixture.nativeElement.querySelector('.cr-detail__totals').textContent;
		const rows = fixture.nativeElement.querySelectorAll('.cr-diff__row');

		expect(totals).toContain('USD 8,000.00 → USD 8,500.00');
		expect(totals).toContain('Δ USD 500.00');
		expect(rows.length).toBe(2);
		expect(rows[0].getAttribute('data-kind')).toBe('changed');
		expect(rows[1].getAttribute('data-kind')).toBe('unchanged');
	});
});
