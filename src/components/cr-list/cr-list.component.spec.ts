import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrListComponent } from './cr-list.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { CrApiService } from '../../api/cr-api.service';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function create(user: ReqUser): Promise<ComponentFixture<CrListComponent>> {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	return TestBed.createComponent(CrListComponent);
}

async function render(user: ReqUser): Promise<ComponentFixture<CrListComponent>> {
	const fixture = await create(user);
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded/empty state
	return fixture;
}

describe('CrListComponent', () => {
	it('renders a row per change request in the user org', async () => {
		const fixture = await render(users.approver);
		expect(fixture.nativeElement.querySelectorAll('.cr-list__row').length).toBe(3); // org-alpha: CR-1, CR-2, CR-3
	});

	it('shows the empty state when the org has no change requests', async () => {
		const fixture = await render({ id: 'x', orgCode: 'org-empty', policies: ['cr_r_o'] });
		expect(fixture.nativeElement.querySelector('.cr-list__empty')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
	});

	it('renders only matching rows after the status filter changes', async () => {
		const fixture = await render(users.approver);
		const filter: HTMLSelectElement = fixture.nativeElement.querySelector('.cr-list__filter');

		filter.value = 'PENDING_APPROVAL';
		filter.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		const rows = fixture.nativeElement.querySelectorAll('.cr-list__row');
		expect(rows.length).toBe(1);
		expect(rows[0].textContent).toContain('CR-1');
	});

	it('shows the filter-empty state when the selected status has no matches', async () => {
		const fixture = await render(users.approver);
		const filter: HTMLSelectElement = fixture.nativeElement.querySelector('.cr-list__filter');

		filter.value = 'APPROVED';
		filter.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-list__filter-empty')?.textContent).toContain('No change requests match this status.');
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
	});

	it('emits the change request ID when a row is clicked', async () => {
		const fixture = await render(users.approver);
		const selected = jest.fn();
		fixture.componentInstance.select.subscribe(selected);

		const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('.cr-list__row');
		firstRow.click();

		expect(selected).toHaveBeenCalledWith('CR-1');
	});

	it('shows the loading state before the list request resolves', async () => {
		const fixture = await create(users.approver);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-list__loading')).not.toBeNull();

		await flush();
		fixture.detectChanges();
	});

	it('shows an error and recovers when the user retries', async () => {
		const fixture = await create(users.approver);
		const api = TestBed.inject(CrApiService);
		api.failNext = true;

		fixture.detectChanges();
		await flush();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-list__error')?.textContent).toContain("Couldn't load change requests: Network error");
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();

		const retry: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-list__error button');
		retry.click();
		await flush();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-list__error')).toBeNull();
		expect(fixture.nativeElement.querySelectorAll('.cr-list__row').length).toBe(3);
	});
});
