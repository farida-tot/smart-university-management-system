import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog';

@Component({
  selector: 'app-departments',
  imports: [FormsModule, RouterLink],
  templateUrl: './departments.html',
  styleUrl: './departments.css'
})
export class Departments implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  departments: any[] = [];
  search = '';
  loading = true;
  error = '';

  ngOnInit() {
    this.catalog.getDepartments().subscribe({
      next: departments => { this.departments = departments; this.loading = false; this.changeDetector.markForCheck(); },
      error: error => { this.error = error.error?.message ?? 'Unable to load departments.'; this.loading = false; this.changeDetector.markForCheck(); }
    });
  }

  get visibleDepartments() {
    const query = this.search.trim().toLowerCase();
    if (!query) return this.departments;
    return this.departments.filter(department =>
      department.name.toLowerCase().includes(query) || department.code.toLowerCase().includes(query) || department.description?.toLowerCase().includes(query) ||
      department.courses?.some((course: any) => `${course.code} ${course.name}`.toLowerCase().includes(query))
    );
  }
}
