from django import template

register = template.Library()

@register.filter(name='split')
def split(value, arg):  # value is the file, and arg is the given value. In my case -> "."
    result = str(value).split(arg)
    # print(result)
    file_name = result[0].split("file/")[1] # Contains only the file name, no extension
    file_extension = result[-1] # Contains only the file extension
    result = value  # Contains the file info
    # print(file_name, file_extension)
    return  file_name, file_extension, result